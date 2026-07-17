/**
 * POST /api/generate
 * The core SchemaForge API — generates an AWS database schema from a natural language description.
 *
 * Flow:
 * 1. Check DynamoDB cache (same prompt? return cached result instantly)
 * 2. If not cached: call GPT-4o to analyze and generate schema
 * 3. Store result in DynamoDB cache (TTL 24h)
 * 4. Optionally save to Aurora PostgreSQL (if user is logged in and requests save)
 * 5. Track generation event in Aurora for analytics
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getCachedSchema,
  cacheSchema,
  saveSchema,
  trackPopularTemplate,
  type TargetDatabase,
  type GeneratedSchema,
} from '@/lib/db'
import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const GenerateRequestSchema = z.object({
  description: z.string().min(20).max(2000),
  targetDatabase: z.enum(['aurora-postgresql', 'aurora-dsql', 'dynamodb', 'auto']).default('auto'),
  scale: z.enum(['prototype', 'startup', 'enterprise']).default('startup'),
  save: z.boolean().default(false),
  name: z.string().max(200).optional(),
})

const SYSTEM_PROMPT = `You are an expert AWS database architect specializing in Aurora PostgreSQL, Aurora DSQL, and DynamoDB.
Analyze the user's application description and generate a complete, production-ready database schema.

Return a JSON object with this EXACT structure:
{
  "targetDatabase": "aurora-postgresql" | "aurora-dsql" | "dynamodb",
  "recommendation": "string — 2-3 sentences explaining why this database was chosen over the alternatives",
  "confidenceScore": number (0-100),
  "schema": "string — complete SQL DDL (for Aurora) or JSON access patterns + table design (for DynamoDB)",
  "erDiagram": "string — valid Mermaid ER diagram syntax (erDiagram block)",
  "cloudFormationTemplate": "string — complete CloudFormation YAML for this database resource",
  "costEstimate": {
    "monthly": number (USD),
    "currency": "USD",
    "assumptions": ["string array of assumptions made"]
  },
  "performanceTips": ["string array of 3-5 specific performance recommendations"]
}

Database selection rules:
- aurora-postgresql: complex relationships, ACID transactions, analytical queries, full-text search, pg_vector for AI
- aurora-dsql: globally distributed, multi-region active-active, PostgreSQL-compatible, serverless
- dynamodb: high throughput (100K+ writes/sec), simple key-value/document, gaming, social, IoT, caching

For DynamoDB, provide:
- Single-table design where appropriate
- All entity types with PK/SK patterns
- GSI definitions with query access patterns
- TTL attributes where relevant

For Aurora, provide:
- Complete CREATE TABLE statements with proper types
- Appropriate indexes (including pg_vector if AI/ML mentioned)
- Row-level security policies if multi-tenant
- Relevant views or functions

Only return valid JSON. No markdown.`

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const session = await getServerSession(authOptions)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parseResult = GenerateRequestSchema.safeParse(body)
  if (!parseResult.success) {
    return Response.json({ error: 'Invalid request', details: parseResult.error.issues }, { status: 400 })
  }

  const { description, targetDatabase, scale, save, name } = parseResult.data
  const effectiveTargetDb = targetDatabase === 'auto' ? undefined : (targetDatabase as TargetDatabase)

  // ── Step 1: Check DynamoDB cache ──
  // If the exact same prompt was generated before (by any user), return instantly
  const cachedResult = await getCachedSchema(description, effectiveTargetDb)
  if (cachedResult) {
    // Save to user's account if requested
    let savedSchema = null
    if (save && session?.user?.id) {
      savedSchema = await saveSchema(session.user.id, {
        name: name ?? `Schema from ${new Date().toLocaleDateString()}`,
        description,
        targetDatabase: cachedResult.targetDatabase,
        prompt: description,
        schema: cachedResult.schema,
        erDiagram: cachedResult.erDiagram,
        cloudFormationTemplate: cachedResult.cloudFormationTemplate,
      })
    }

    return Response.json({
      ...cachedResult,
      cacheHit: true,
      generationMs: Date.now() - startTime,
      savedSchemaId: savedSchema?.id,
    })
  }

  // ── Step 2: Generate with GPT-4o ──
  const userPrompt = `Application Description: "${description}"
Scale: ${scale}
${effectiveTargetDb ? `Preferred Database: ${effectiveTargetDb}` : 'Recommend the best database for this use case.'}

Generate a complete, production-ready database schema with CloudFormation template.`

  let generatedSchema: GeneratedSchema
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,  // Low temperature for consistent, structured output
      max_tokens: 6000,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content
    if (!raw) throw new Error('Empty AI response')
    generatedSchema = JSON.parse(raw) as GeneratedSchema
  } catch (err) {
    console.error('AI generation error:', err)
    return Response.json({ error: 'Schema generation failed' }, { status: 500 })
  }

  const generationMs = Date.now() - startTime

  // ── Step 3: Cache in DynamoDB (fire-and-forget) ──
  cacheSchema(description, generatedSchema, effectiveTargetDb).catch(console.error)

  // ── Step 4: Track popular template in DynamoDB ──
  trackPopularTemplate(generatedSchema.targetDatabase, generatedSchema.targetDatabase).catch(console.error)

  // ── Step 5: Save to Aurora PostgreSQL if requested ──
  let savedSchemaId: string | undefined
  if (save && session?.user?.id) {
    try {
      const saved = await saveSchema(session.user.id, {
        name: name ?? `Schema from ${new Date().toLocaleDateString()}`,
        description,
        targetDatabase: generatedSchema.targetDatabase,
        prompt: description,
        schema: generatedSchema.schema,
        erDiagram: generatedSchema.erDiagram,
        cloudFormationTemplate: generatedSchema.cloudFormationTemplate,
      })
      savedSchemaId = saved.id

      // Track generation event in Aurora for analytics
      const { pgDb } = await import('@/lib/db')
      await pgDb`
        INSERT INTO generation_events (user_id, target_database, cache_hit, generation_ms, prompt_length)
        VALUES (${session.user.id}, ${generatedSchema.targetDatabase}, false, ${generationMs}, ${description.length})
      `.catch(console.error)

      // Increment user's generation count
      await pgDb`
        UPDATE users SET schemas_generated = schemas_generated + 1 WHERE id = ${session.user.id}
      `.catch(console.error)
    } catch (err) {
      console.error('Failed to save schema to Aurora:', err)
      // Non-critical — return the generated schema anyway
    }
  }

  return Response.json({
    ...generatedSchema,
    cacheHit: false,
    generationMs,
    savedSchemaId,
  })
}
