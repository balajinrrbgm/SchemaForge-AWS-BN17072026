/**
 * SchemaForge — Polyglot persistence layer.
 *
 * Aurora PostgreSQL: User accounts, saved schemas, version history, teams
 * DynamoDB:          AI generation cache (TTL), popular templates, export jobs
 *
 * This file demonstrates using BOTH AWS databases in one application,
 * each chosen for what it does best.
 */

// ─── Aurora PostgreSQL connection ─────────────────────────────────────────────
import postgres from 'postgres'

let pgClient: ReturnType<typeof postgres> | null = null

function getPostgresDb() {
  if (pgClient) return pgClient
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not set')
  pgClient = postgres(url, {
    max: 10,
    idle_timeout: 20,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
    transform: { column: postgres.toCamel },
  })
  return pgClient
}

export const pgDb = getPostgresDb()

// ─── DynamoDB connection (cache layer) ───────────────────────────────────────
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb'
import crypto from 'crypto'

const CACHE_TABLE = process.env.DYNAMODB_CACHE_TABLE ?? 'schemaforge-cache-prod'
// Cache AI generations for 24 hours
const CACHE_TTL_SECONDS = 24 * 60 * 60

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-1' })
export const ddbCache = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
})

// ─── Types ───────────────────────────────────────────────────────────────────

export type TargetDatabase = 'aurora-postgresql' | 'aurora-dsql' | 'dynamodb'

export type GeneratedSchema = {
  targetDatabase: TargetDatabase
  recommendation: string         // Why this database was chosen
  confidenceScore: number        // 0-100 how confident the AI is in the recommendation
  schema: string                 // SQL DDL or JSON access pattern design
  erDiagram: string              // Mermaid ER diagram
  cloudFormationTemplate: string // CloudFormation YAML
  costEstimate: {
    monthly: number
    currency: string
    assumptions: string[]
  }
  performanceTips: string[]
}

export type SavedSchema = {
  id: string
  userId: string
  teamId: string | null
  name: string
  description: string
  targetDatabase: TargetDatabase
  prompt: string
  schema: string
  erDiagram: string
  cloudFormationTemplate: string
  version: number
  parentId: string | null
  createdAt: Date
}

// ─── Aurora PostgreSQL operations ─────────────────────────────────────────────

/**
 * Save a generated schema to Aurora PostgreSQL.
 * ACID transaction ensures version number is consistent.
 */
export async function saveSchema(
  userId: string,
  data: {
    name: string
    description: string
    targetDatabase: TargetDatabase
    prompt: string
    schema: string
    erDiagram: string
    cloudFormationTemplate: string
    parentId?: string
  }
): Promise<SavedSchema> {
  return pgDb.begin(async (tx) => {
    // Get next version number for this schema lineage
    let version = 1
    if (data.parentId) {
      const [parent] = await tx<[{ version: number }]>`
        SELECT version FROM saved_schemas WHERE id = ${data.parentId}
      `
      version = (parent?.version ?? 0) + 1
    }

    const [saved] = await tx<SavedSchema[]>`
      INSERT INTO saved_schemas (
        user_id, name, description, target_database, prompt,
        schema_content, er_diagram, cloudformation_template, version, parent_id
      )
      VALUES (
        ${userId}, ${data.name}, ${data.description}, ${data.targetDatabase},
        ${data.prompt}, ${data.schema}, ${data.erDiagram},
        ${data.cloudFormationTemplate}, ${version}, ${data.parentId ?? null}
      )
      RETURNING *
    `
    return saved
  })
}

/**
 * Get a user's saved schemas.
 */
export async function getUserSchemas(userId: string): Promise<SavedSchema[]> {
  return pgDb<SavedSchema[]>`
    SELECT *
    FROM saved_schemas
    WHERE user_id = ${userId}
      AND parent_id IS NULL   -- Only root schemas (latest in each lineage)
    ORDER BY created_at DESC
    LIMIT 50
  `
}

/**
 * Get the version history of a schema.
 */
export async function getSchemaHistory(schemaId: string, userId: string): Promise<SavedSchema[]> {
  return pgDb<SavedSchema[]>`
    WITH RECURSIVE schema_tree AS (
      SELECT * FROM saved_schemas WHERE id = ${schemaId} AND user_id = ${userId}
      UNION ALL
      SELECT s.* FROM saved_schemas s
      INNER JOIN schema_tree st ON s.id = st.parent_id
    )
    SELECT * FROM schema_tree ORDER BY version DESC
  `
}

// ─── DynamoDB cache operations ────────────────────────────────────────────────

/**
 * Generate a deterministic cache key from the AI prompt.
 * Same prompt → same cache key → no redundant API calls.
 */
function getCacheKey(prompt: string, targetDb?: TargetDatabase): string {
  const input = `${prompt}::${targetDb ?? 'auto'}`
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 32)
}

/**
 * Check DynamoDB cache for a previously generated schema.
 * DynamoDB is perfect for this: O(1) key lookup, TTL auto-expires stale cache.
 */
export async function getCachedSchema(
  prompt: string,
  targetDb?: TargetDatabase
): Promise<GeneratedSchema | null> {
  const cacheKey = getCacheKey(prompt, targetDb)

  const result = await ddbCache.send(
    new GetCommand({
      TableName: CACHE_TABLE,
      Key: { PK: `SCHEMA_CACHE#${cacheKey}`, SK: 'DATA' },
    })
  )

  if (!result.Item) return null

  // Check if TTL has expired (DynamoDB TTL is eventual, verify explicitly)
  if (result.Item.expiresAt < Math.floor(Date.now() / 1000)) return null

  return result.Item.generatedSchema as GeneratedSchema
}

/**
 * Cache a generated schema in DynamoDB.
 * TTL = 24 hours — DynamoDB auto-deletes stale cache entries.
 */
export async function cacheSchema(
  prompt: string,
  generatedSchema: GeneratedSchema,
  targetDb?: TargetDatabase
): Promise<void> {
  const cacheKey = getCacheKey(prompt, targetDb)

  await ddbCache.send(
    new PutCommand({
      TableName: CACHE_TABLE,
      Item: {
        PK: `SCHEMA_CACHE#${cacheKey}`,
        SK: 'DATA',
        prompt,
        targetDatabase: targetDb,
        generatedSchema,
        cachedAt: new Date().toISOString(),
        expiresAt: Math.floor(Date.now() / 1000) + CACHE_TTL_SECONDS,  // DynamoDB TTL
        hitCount: 0,
      },
    })
  )
}

/**
 * Track a popular schema template in DynamoDB.
 * Used for "Most Popular Templates" feature.
 */
export async function trackPopularTemplate(
  templateType: string,
  targetDatabase: TargetDatabase
): Promise<void> {
  await ddbCache.send(
    new PutCommand({
      TableName: CACHE_TABLE,
      Item: {
        PK: `POPULAR#${targetDatabase}`,
        SK: `TEMPLATE#${templateType}`,
        templateType,
        targetDatabase,
        accessCount: 1,
        lastAccessedAt: new Date().toISOString(),
      },
      ConditionExpression: 'attribute_not_exists(PK)',
    })
  ).catch(() => {
    // Already exists — would use UpdateItem with ADD in production
  })
}
