import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useResearchStream } from './hooks/useResearchStream';

export default function App() {
  const [query, setQuery] = useState('');
  const { startResearch, streamedText, status, currentNode, isStreaming } = useResearchStream();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      startResearch(query);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', color: '#111827', marginBottom: '8px' }}>🎓 Academic Literature Agent</h1>
        <p style={{ color: '#6B7280', margin: 0 }}>Multi-agent RAG engine powered by FastAPI, LangGraph, Groq, and ArXiv.</p>
      </header>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., State Space Models vs Transformers for long context..."
          disabled={isStreaming}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isStreaming || !query.trim()}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isStreaming ? '#9CA3AF' : '#2563EB',
            color: '#FFFFFF',
            cursor: isStreaming ? 'not-allowed' : 'pointer',
          }}
        >
          {isStreaming ? 'Searching...' : 'Run Pipeline'}
        </button>
      </form>

      {/* Agent Progress Banner */}
      {(status || currentNode) && (
        <div style={{ padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', marginBottom: '24px' }}>
          <p style={{ margin: 0, color: '#1E40AF', fontWeight: 600 }}>{status}</p>
          {currentNode && (
            <p style={{ margin: '6px 0 0 0', color: '#1D4ED8', fontSize: '14px' }}>
              Active Stage: <strong>{currentNode.toUpperCase()} AGENT</strong>
            </p>
          )}
        </div>
      )}

      {/* Streamed Research Report Output */}
      <main style={{ padding: '24px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', minHeight: '300px' }}>
        {streamedText ? (
          <ReactMarkdown>{streamedText}</ReactMarkdown>
        ) : (
          <p style={{ color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>
            Enter a research topic above to trigger the multi-agent graph...
          </p>
        )}
      </main>
    </div>
  );
}