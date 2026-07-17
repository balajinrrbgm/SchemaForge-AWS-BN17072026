'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SchemaVisualizer } from '@/components/SchemaVisualizer'

const EXAMPLE_PROMPTS = [
  'Multi-tenant SaaS platform with users, teams, subscriptions, and activity logs for 100K customers',
  'Real-time multiplayer game with player profiles, matchmaking, leaderboards, and item inventories for 1M users',
  'E-commerce marketplace with product catalog, orders, reviews, inventory, and seller dashboards',
  'Social media app with posts, follows, likes, comments, stories, and notifications at Twitter scale',
  'Healthcare records system with patients, appointments, diagnoses, prescriptions, and billing',
]

type DbRecommendation = 'aurora-postgresql' | 'aurora-dsql' | 'dynamodb'
type GeneratedResult = {
  targetDatabase: DbRecommendation
  recommendation: string
  confidenceScore: number
  schema: string
  erDiagram: string
  cloudFormationTemplate: string
  costEstimate: { monthly: number; currency: string; assumptions: string[] }
  performanceTips: string[]
  cacheHit: boolean
  generationMs: number
}

const DB_INFO: Record<DbRecommendation, { label: string; color: string; icon: string; description: string }> = {
  'aurora-postgresql': {
    label: 'Aurora PostgreSQL',
    color: 'orange',
    icon: '🐘',
    description: 'Best for relational data, ACID transactions, analytical queries',
  },
  'aurora-dsql': {
    label: 'Aurora DSQL',
    color: 'purple',
    icon: '🌍',
    description: 'Best for globally distributed, multi-region active-active workloads',
  },
  'dynamodb': {
    label: 'DynamoDB',
    color: 'blue',
    icon: '⚡',
    description: 'Best for massive scale, simple access patterns, gaming, IoT',
  },
}

export default function Home() {
  const [description, setDescription] = useState('')
  const [targetDb, setTargetDb] = useState<DbRecommendation | 'auto'>('auto')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!description.trim() || description.length < 20) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, targetDatabase: targetDb }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Generation failed')
      }
      const data = await res.json()
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          <span className="font-bold text-xl bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            SchemaForge
          </span>
          <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
            AI
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">
            How it works
          </a>
          <a href="#databases" className="text-gray-400 hover:text-white transition-colors">
            Databases
          </a>
          <button className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg transition-colors">
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-6">
            <span>✨</span>
            <span>Uses Aurora PostgreSQL + DynamoDB to design your schemas</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            From idea to{' '}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              AWS database schema
            </span>
            {' '}in seconds
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Describe your application. SchemaForge recommends the right AWS database,
            generates a production-ready schema, ER diagram, and CloudFormation template — instantly.
          </p>
        </motion.div>
      </section>

      {/* Generator */}
      <section className="max-w-3xl mx-auto px-6 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-gray-900 p-6"
        >
          {/* Target DB selector */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['auto', 'aurora-postgresql', 'aurora-dsql', 'dynamodb'] as const).map((db) => (
              <button
                key={db}
                onClick={() => setTargetDb(db)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  targetDb === db
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                }`}
              >
                {db === 'auto' ? '✨ Auto-recommend' : DB_INFO[db].icon + ' ' + DB_INFO[db].label}
              </button>
            ))}
          </div>

          {/* Text area */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your application... e.g., 'Multi-tenant SaaS platform with users, teams, subscriptions, and activity logs for 100K customers'"
            className="w-full h-36 bg-gray-800 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-violet-500 transition-colors"
          />

          {/* Example prompts */}
          <div className="mt-3 mb-4">
            <p className="text-xs text-gray-500 mb-2">Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setDescription(prompt)}
                  className="text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-2.5 py-1 rounded-full transition-colors"
                >
                  {prompt.slice(0, 50)}…
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || description.length < 20}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>Generating schema…</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Generate Schema</span>
              </>
            )}
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-400 text-center">{error}</p>
          )}
        </motion.div>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6 space-y-4"
          >
            {/* Recommendation card */}
            <div className="rounded-xl border border-white/10 bg-gray-900 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{DB_INFO[result.targetDatabase].icon}</span>
                    <span className="font-semibold">{DB_INFO[result.targetDatabase].label}</span>
                    <span className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full">
                      {result.confidenceScore}% confident
                    </span>
                    {result.cacheHit && (
                      <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                        ⚡ Cached
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{result.recommendation}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="text-2xl font-bold text-violet-400">
                    ${result.costEstimate.monthly}
                    <span className="text-sm text-gray-500">/mo</span>
                  </div>
                  <div className="text-xs text-gray-500">{result.generationMs}ms</div>
                </div>
              </div>

              {/* Performance tips */}
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-xs font-medium text-gray-400 mb-2">Performance Tips</p>
                <ul className="space-y-1">
                  {result.performanceTips.slice(0, 3).map((tip, i) => (
                    <li key={i} className="text-xs text-gray-500 flex gap-2">
                      <span className="text-violet-400 shrink-0">→</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Schema visualizer */}
            <SchemaVisualizer
              schema={result.schema}
              erDiagram={result.erDiagram}
              cloudFormationTemplate={result.cloudFormationTemplate}
              targetDatabase={result.targetDatabase}
            />
          </motion.div>
        )}
      </section>

      {/* Database selector section */}
      <section id="databases" className="max-w-4xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-bold text-center mb-2">Which database is right for you?</h2>
        <p className="text-gray-400 text-center mb-10">SchemaForge knows. Describe your app and let AI decide.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(DB_INFO) as DbRecommendation[]).map((db) => {
            const info = DB_INFO[db]
            return (
              <div key={db} className="rounded-xl border border-white/10 bg-gray-900 p-5">
                <div className="text-3xl mb-3">{info.icon}</div>
                <h3 className="font-semibold mb-2">{info.label}</h3>
                <p className="text-sm text-gray-400 mb-4">{info.description}</p>
                <button
                  onClick={() => {
                    setTargetDb(db)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Generate {info.label} schema →
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Meta section */}
      <section className="max-w-3xl mx-auto px-6 mb-20">
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">The meta story</h2>
          <p className="text-gray-400 text-lg mb-6">
            SchemaForge uses <strong className="text-white">Aurora PostgreSQL</strong> to store your schema history
            with ACID transactions and version control. It uses <strong className="text-white">DynamoDB</strong> to
            cache AI generations at scale with TTL. Two databases, each chosen for what they do best —
            exactly the decision we help you make.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="font-semibold text-orange-300 mb-1">Aurora PostgreSQL</div>
              <div className="text-gray-400">User accounts, schemas, version history</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="font-semibold text-blue-300 mb-1">DynamoDB</div>
              <div className="text-gray-400">AI generation cache, 24h TTL</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-gray-500">
        <p>SchemaForge — Built for the H0: Hack the Zero Stack hackathon</p>
        <p className="mt-1">Aurora PostgreSQL + DynamoDB + Next.js + Vercel</p>
      </footer>
    </div>
  )
}
