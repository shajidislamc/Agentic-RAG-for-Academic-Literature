import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// @ts-ignore (If TypeScript throws a missing declaration error for html2pdf.js)
import html2pdf from 'html2pdf.js';
import { useResearchStream } from './hooks/useResearchStream';

export default function App() {
  const [query, setQuery] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  
  const { startResearch, streamedText, status, currentNode, isStreaming, logs } = useResearchStream();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      startResearch(query, customApiKey);
    }
  };

  // --- Export as Markdown (.md) ---
  const handleDownloadMarkdown = () => {
    if (!streamedText) return;
    const blob = new Blob([streamedText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `literature_review_${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Export as PDF (.pdf) ---
  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element || !streamedText) return;

    window.scrollTo(0, 0);

    const opt = {
      margin: 15,
      filename: `literature_review_${Date.now()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1200 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
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
        <header style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              padding: '8px 14px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              color: '#475569'
            }}
          >
            ⚙️ Settings
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            🎓 Academic Literature Agent
          </h1>
          <p style={{ color: '#64748B', fontSize: '15px', margin: 0 }}>
            Autonomous Multi-Agent RAG Engine powered by LangGraph, FastAPI, Groq & ArXiv
          </p>
        </header>

        {/* Collapsible BYOK Settings Bar */}
        {showSettings && (
          <div style={{ padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Custom Groq API Key (Optional):
            </label>
            <input
              type="password"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="gsk_..."
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* Search Input Bar */}
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
            backgroundColor: status.includes('⚠️') || status.includes('Rate limit') ? '#FEF2F2' : '#EFF6FF',
            borderRadius: '10px',
            border: `1px solid ${status.includes('⚠️') || status.includes('Rate limit') ? '#FCA5A5' : '#BFDBFE'}`,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: status.includes('⚠️') || status.includes('Rate limit') ? '#991B1B' : '#1E40AF', fontWeight: 600, fontSize: '14px' }}>
              {status}
            </span>
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

        {/* Final Synthesizer Output Canvas */}
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
          {/* Header Action Bar with Download Buttons */}
          {streamedText && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <button
                onClick={handleDownloadMarkdown}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                📥 Export Markdown (.md)
              </button>
              <button
                onClick={handleDownloadPDF}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #BFDBFE',
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  cursor: 'pointer'
                }}
              >
                📄 Export PDF (.pdf)
              </button>
            </div>
          )}

          {/* Report Container (Targeted for PDF conversion & Rendered Markdown) */}
          {streamedText ? (
            <div id="report-content" className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Wraps every markdown table in a horizontally scrollable container with min-width constraint
                  table: ({ node, ...props }) => (
                    <div
                      style={{
                        overflowX: 'auto',
                        width: '100%',
                        margin: '20px 0',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      <table
                        style={{
                          width: '100%',
                          minWidth: '750px', // Forces horizontal sliding scrollbar when view width shrinks
                          borderCollapse: 'collapse',
                          fontSize: '14px',
                          textAlign: 'left'
                        }}
                        {...props}
                      />
                    </div>
                  ),
                  th: ({ node, ...props }) => (
                    <th
                      style={{
                        backgroundColor: '#F8FAFC',
                        color: '#1E293B',
                        fontWeight: 700,
                        padding: '12px 16px',
                        borderBottom: '2px solid #E2E8F0',
                        borderRight: '1px solid #F1F5F9'
                      }}
                      {...props}
                    />
                  ),
                  td: ({ node, ...props }) => (
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #E2E8F0',
                        borderRight: '1px solid #F1F5F9',
                        color: '#334155',
                        verticalAlign: 'top'
                      }}
                      {...props}
                    />
                  )
                }}
              >
                {streamedText}
              </ReactMarkdown>
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
    </div>
  );
}