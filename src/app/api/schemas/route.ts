/**
 * GET  /api/schemas         — List user's saved schemas
 * POST /api/schemas         — Save or update a schema
 * GET  /api/schemas/[id]    — Get schema detail with version history
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserSchemas, saveSchema, type TargetDatabase } from '@/lib/db'
import { z } from 'zod'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const schemas = await getUserSchemas(session.user.id)
    return Response.json({ schemas })
  } catch (err) {
    console.error('Failed to fetch schemas:', err)
    return Response.json({ error: 'Failed to fetch schemas' }, { status: 500 })
  }
}

const SaveSchemaSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  targetDatabase: z.enum(['aurora-postgresql', 'aurora-dsql', 'dynamodb']),
  prompt: z.string().min(1).max(2000),
  schema: z.string().min(1),
  erDiagram: z.string().optional().default(''),
  cloudFormationTemplate: z.string().optional().default(''),
  parentId: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parseResult = SaveSchemaSchema.safeParse(body)
  if (!parseResult.success) {
    return Response.json({ error: 'Invalid request', details: parseResult.error.issues }, { status: 400 })
  }

  try {
    const saved = await saveSchema(session.user.id, {
      ...parseResult.data,
      targetDatabase: parseResult.data.targetDatabase as TargetDatabase,
    })
    return Response.json({ schema: saved }, { status: 201 })
  } catch (err) {
    console.error('Failed to save schema:', err)
    return Response.json({ error: 'Failed to save schema' }, { status: 500 })
  }
}
