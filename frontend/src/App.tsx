// frontend/src/App.tsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '40px 20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
{/* Header */}
<header style={{ textAlign: 'center', marginBottom: '32px' }}>
  <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
    🎓 Academic Literature Agent
  </h1>
</header>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topic (e.g., Efficient inference transformer pruning and quantization)..."
            disabled={isStreaming}
            style={{
              flex: 1,
              padding: '14px 18px',
              fontSize: '15px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          />
          <button
            type="submit"
            disabled={isStreaming || !query.trim()}
            style={{
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 600,
              borderRadius: '10px',
              border: 'none',
              backgroundColor: isStreaming ? '#94A3B8' : '#2563EB',
              color: '#FFFFFF',
              cursor: isStreaming ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {isStreaming ? 'Running...' : 'Run Pipeline'}
          </button>
        </form>

        {/* Status Indicator */}
        {(status || currentNode) && (
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#EFF6FF',
            borderRadius: '10px',
            border: '1px solid #BFDBFE',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#1E40AF', fontWeight: 600, fontSize: '14px' }}>{status}</span>
            {currentNode && (
              <span style={{
                backgroundColor: '#DBEAFE',
                color: '#1D4ED8',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}>
                STAGE: {currentNode.toUpperCase()}
              </span>
            )}
          </div>
        )}

        {/* Streamed Research Report Output */}
        <main style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '36px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          minHeight: '400px',
          lineHeight: 1.7,
          color: '#334155'
        }}>
          {streamedText ? (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamedText}</ReactMarkdown>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
              <p style={{ margin: 0, fontSize: '16px' }}>Enter a query above to stream research reports live.</p>
            </div>
          )}
        </main>
      </div>

{/* Global Markdown Styles */}
      <style>{`
        .markdown-body h1 { font-size: 24px; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; margin-top: 24px; color: #0F172A; }
        .markdown-body h2 { font-size: 20px; margin-top: 20px; color: #1E293B; }
        .markdown-body h3 { font-size: 16px; margin-top: 16px; color: #334155; }
        .markdown-body p { margin-bottom: 16px; }
        .markdown-body ul, .markdown-body ol { padding-left: 24px; margin-bottom: 16px; }
        .markdown-body li { margin-bottom: 6px; }
        
        /* Table Overflow & Scroll Containment */
        .markdown-body table { 
          display: block; 
          width: 100%; 
          overflow-x: auto; 
          border-collapse: collapse; 
          margin: 20px 0; 
          font-size: 14px; 
        }
        .markdown-body th, .markdown-body td { 
          border: 1px solid #CBD5E1; 
          padding: 10px 14px; 
          text-align: left; 
          min-width: 130px; 
          white-space: normal; 
        }
        .markdown-body th { background-color: #F1F5F9; font-weight: 600; color: #0F172A; }
        .markdown-body tr:nth-child(even) { background-color: #F8FAFC; }
        
        .markdown-body code { background-color: #F1F5F9; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: monospace; }
        .markdown-body blockquote { border-left: 4px solid #2563EB; padding-left: 16px; margin: 16px 0; color: #475569; font-style: italic; }
      `}</style>
    </div>
  );
}