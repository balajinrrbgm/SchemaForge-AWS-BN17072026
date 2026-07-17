'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface SchemaVisualizerProps {
  schema: string
  erDiagram: string
  cloudFormationTemplate: string
  targetDatabase: 'aurora-postgresql' | 'aurora-dsql' | 'dynamodb'
}

type Tab = 'schema' | 'diagram' | 'cloudformation'

export function SchemaVisualizer({
  schema,
  erDiagram,
  cloudFormationTemplate,
  targetDatabase,
}: SchemaVisualizerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('schema')
  const diagramRef = useRef<HTMLDivElement>(null)
  const [mermaidLoaded, setMermaidLoaded] = useState(false)

  const schemaLanguage = targetDatabase === 'dynamodb' ? 'json' : 'sql'
  const tabs: { key: Tab; label: string }[] = [
    { key: 'schema', label: targetDatabase === 'dynamodb' ? 'Access Patterns' : 'SQL Schema' },
    { key: 'diagram', label: 'ER Diagram' },
    { key: 'cloudformation', label: 'CloudFormation' },
  ]

  useEffect(() => {
    // Dynamically load Mermaid only on client
    import('mermaid').then((m) => {
      m.default.initialize({ startOnLoad: false, theme: 'dark', er: { useMaxWidth: true } })
      setMermaidLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (activeTab === 'diagram' && mermaidLoaded && diagramRef.current && erDiagram) {
      import('mermaid').then(async (m) => {
        try {
          const { svg } = await m.default.render('er-diagram', erDiagram)
          if (diagramRef.current) diagramRef.current.innerHTML = svg
        } catch {
          if (diagramRef.current) {
            diagramRef.current.innerHTML = `<pre class="text-sm text-red-400 p-4">${erDiagram}</pre>`
          }
        }
      })
    }
  }, [activeTab, mermaidLoaded, erDiagram])

  function handleCopy(content: string) {
    navigator.clipboard.writeText(content)
  }

  const dbBadgeColor = {
    'aurora-postgresql': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'aurora-dsql': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'dynamodb': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  }[targetDatabase]

  const dbLabel = {
    'aurora-postgresql': 'Aurora PostgreSQL',
    'aurora-dsql': 'Aurora DSQL',
    'dynamodb': 'DynamoDB',
  }[targetDatabase]

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono px-2 py-1 rounded-full border ${dbBadgeColor}`}>
            {dbLabel}
          </span>
          <span className="text-xs text-gray-500">Generated schema</span>
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {activeTab === 'schema' && (
          <div className="h-96">
            <MonacoEditor
              height="100%"
              language={schemaLanguage}
              value={schema}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
              }}
            />
          </div>
        )}

        {activeTab === 'diagram' && (
          <div className="p-6 min-h-64 flex items-center justify-center bg-gray-950">
            {erDiagram ? (
              <div ref={diagramRef} className="w-full overflow-auto" />
            ) : (
              <p className="text-gray-500 text-sm">No ER diagram generated</p>
            )}
          </div>
        )}

        {activeTab === 'cloudformation' && (
          <div className="h-96">
            <MonacoEditor
              height="100%"
              language="yaml"
              value={cloudFormationTemplate}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        )}

        {/* Copy button */}
        <button
          onClick={() =>
            handleCopy(
              activeTab === 'schema'
                ? schema
                : activeTab === 'diagram'
                ? erDiagram
                : cloudFormationTemplate
            )
          }
          className="absolute top-3 right-3 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-gray-300 transition-colors"
        >
          Copy
        </button>
      </div>
    </div>
  )
}
