import { useState } from 'react';

export function useResearchStream() {
  const [status, setStatus] = useState<string>('');
  const [currentNode, setCurrentNode] = useState<string>('');
  const [streamedText, setStreamedText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const startResearch = async (query: string) => {
    setIsStreaming(true);
    setStreamedText('');
    setStatus('Initializing research graph...');
    setCurrentNode('');

    try {
      const response = await fetch('http://localhost:8000/api/research/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, thread_id: Date.now().toString() }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.replace('data: ', ''));

            if (data.type === 'status') setStatus(data.content);
            if (data.type === 'node_start') setCurrentNode(data.node);
            
            // Filter out JSON state leaks and only accept stream tokens
            if (data.type === 'token' && typeof data.content === 'string') {
              const content = data.content;
              if (!content.startsWith('[') && !content.startsWith('{')) {
                setStreamedText((prev) => prev + content);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err);
      setStatus('Error connecting to backend server.');
    } finally {
      setIsStreaming(false);
    }
  };

  return { startResearch, streamedText, status, currentNode, isStreaming };
}