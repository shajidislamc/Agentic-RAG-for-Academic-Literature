import { useState } from 'react';

export interface AgentLog {
  id: string;
  node: string;
  timestamp: string;
  content: string;
}

export function useResearchStream() {
  const [status, setStatus] = useState<string>('');
  const [currentNode, setCurrentNode] = useState<string>('');
  const [streamedText, setStreamedText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);

  const startResearch = async (query: string, customApiKey?: string) => {
    setIsStreaming(true);
    setStreamedText('');
    setLogs([]);
    setStatus('Initializing multi-agent graph...');
    setCurrentNode('');

    try {
      const response = await fetch('/api/research/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          thread_id: Date.now().toString(),
          api_key: customApiKey || undefined 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned status ${response.status}`);
      }

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let activeNode = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));

              if (data.type === 'status') {
                setStatus(data.content);
              }

              if (data.type === 'node_start') {
                activeNode = data.node;
                setCurrentNode(data.node);
              }

              if (data.type === 'error') {
                setStatus(data.message);
                setIsStreaming(false);
                return;
              }

              if (data.type === 'token' && typeof data.content === 'string') {
                const content = data.content;

                if (activeNode === 'synthesizer') {
                  if (!content.startsWith('{') && !content.startsWith('[')) {
                    setStreamedText((prev) => prev + content);
                  }
                } else {
                  if (content.trim()) {
                    setLogs((prev) => {
                      const last = prev[prev.length - 1];
                      if (last && last.node === activeNode) {
                        return [
                          ...prev.slice(0, -1),
                          { ...last, content: last.content + content }
                        ];
                      }
                      return [
                        ...prev,
                        {
                          id: Math.random().toString(36).substring(2, 9),
                          node: activeNode,
                          timestamp: new Date().toLocaleTimeString(),
                          content: content
                        }
                      ];
                    });
                  }
                }
              }
            } catch (e) {
              console.warn('Malformed stream line:', line);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Streaming error:', err);
      setStatus(err.message || 'Error connecting to backend engine.');
    } finally {
      setIsStreaming(false);
    }
  };

  return { startResearch, streamedText, status, currentNode, isStreaming, logs };
}