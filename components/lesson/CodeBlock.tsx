'use client'

import { useState } from 'react'
import type { CodeBlock as CodeBlockType } from '@/types/lesson-content'

interface CodeBlockProps {
  block: CodeBlockType
}

export function CodeBlock({ block }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(block.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-6">
      {block.filename && (
        <div className="bg-dark-secondary px-4 py-2 rounded-t-lg border-b border-dark-border flex items-center justify-between">
          <span className="text-sm text-white/60 font-mono">{block.filename}</span>
          <span className="text-xs text-white/50 uppercase">{block.language}</span>
        </div>
      )}

      <div className="relative group">
        <pre className={`bg-dark p-4 overflow-x-auto ${block.filename ? 'rounded-b-lg' : 'rounded-lg'}`}>
          <code className={`language-${block.language} text-sm text-white/80 font-mono`}>
            {block.showLineNumbers ? (
              <div className="table">
                {block.code.split('\n').map((line, i) => (
                  <div key={i} className="table-row">
                    <span className="table-cell pr-4 text-white/40 select-none text-right">
                      {i + 1}
                    </span>
                    <span className="table-cell">{line}</span>
                  </div>
                ))}
              </div>
            ) : (
              block.code
            )}
          </code>
        </pre>

        <button
          onClick={copyToClipboard}
          className="absolute top-3 right-3 px-3 py-1.5 bg-dark-secondary hover:bg-dark-tertiary text-white/80 text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copiado!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar
            </>
          )}
        </button>
      </div>
    </div>
  )
}


