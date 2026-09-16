import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useResearchStream } from './hooks/useResearchStream';

export default function App() {
  const [query, setQuery] = useState('');
  const [showLogs, setShowLogs] = useState(true);
  const { startResearch, streamedText, status, currentNode, isStreaming, logs } = useResearchStream();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      startResearch(query);
    }
  };

  const getNodeBadgeColor = (node: string) => {
    switch (node.toLowerCase()) {
      case 'planner': return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'retriever': return { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' };
      case 'critic': return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
      case 'synthesizer': return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
      default: return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
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
          <p style={{ color: '#64748B', fontSize: '15px', margin: 0 }}>
            Autonomous Multi-Agent RAG Engine powered by LangGraph, FastAPI, Groq & ArXiv
          </p>
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
            }}
          >
            {isStreaming ? 'Running...' : 'Run Pipeline'}
          </button>
        </form>

        {/* Active Progress Banner */}
        {(status || currentNode) && (
          <div style={{
            padding: '14px 20px',
            backgroundColor: '#EFF6FF',
            borderRadius: '10px',
            border: '1px solid #BFDBFE',
            marginBottom: '20px',
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
                ACTIVE AGENT: {currentNode.toUpperCase()}
              </span>
            )}
          </div>
        )}

        {/* Intermediate Agent Activity Drawer */}
        {logs.length > 0 && (
          <div style={{ marginBottom: '24px', border: '1px solid #E2E8F0', borderRadius: '12px', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
            <button
              onClick={() => setShowLogs(!showLogs)}
              style={{
                width: '100%',
                padding: '12px 20px',
                backgroundColor: '#F8FAFC',
                border: 'none',
                borderBottom: showLogs ? '1px solid #E2E8F0' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                fontWeight: 600,
                color: '#334155',
                fontSize: '14px'
              }}
            >
              <span>🧠 Pipeline Reasoning & Agent Activity ({logs.length} events)</span>
              <span>{showLogs ? '▲ Hide' : '▼ View Logs'}</span>
            </button>

            {showLogs && (
              <div style={{ padding: '16px', maxHeight: '250px', overflowY: 'auto', backgroundColor: '#FAF9F6' }}>
                {logs.map((log) => {
                  const style = getNodeBadgeColor(log.node);
                  return (
                    <div key={log.id} style={{ marginBottom: '12px', padding: '12px', borderRadius: '8px', border: `1px solid ${style.border}`, backgroundColor: '#FFFFFF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ backgroundColor: style.bg, color: style.text, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                          {log.node.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{log.timestamp}</span>
                      </div>
                      <pre style={{ margin: 0, fontSize: '12px', color: '#475569', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                        {log.content}
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Final Synthesizer Research Output */}
        <main style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '40px',
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
              <p style={{ margin: 0, fontSize: '16px' }}>
                {isStreaming ? 'Synthesizing report...' : 'Enter a research topic above to generate a literature review.'}
              </p>
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