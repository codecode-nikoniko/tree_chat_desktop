import { useState, useCallback } from 'react';
import { buildHeaders, buildRequestBody, getEndpoint, parseStreamChunk } from '../utils/providers';

export function useAI(settings) {
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const sendMessage = useCallback(async (messages, onChunk, onComplete) => {
    const apiKey = settings.apiKeys?.[settings.provider];
    if (!apiKey) {
      throw new Error('请先配置 API Key');
    }

    setStreaming(true);
    setStreamingContent('');

    try {
      const headers = buildHeaders(settings.provider, apiKey);
      const body = buildRequestBody(settings.provider, settings.model, messages);
      const endpoint = getEndpoint(settings.provider, settings.baseUrl);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 请求失败: ${response.status} ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;

          const content = parseStreamChunk(settings.provider, data);
          if (content) {
            fullContent += content;
            setStreamingContent(fullContent);
            onChunk?.(content, fullContent);
          }
        }
      }

      setStreaming(false);
      setStreamingContent('');
      onComplete?.(fullContent);
      return fullContent;
    } catch (error) {
      setStreaming(false);
      setStreamingContent('');
      throw error;
    }
  }, [settings]);

  const cancelStreaming = useCallback(() => {
    setStreaming(false);
    setStreamingContent('');
  }, []);

  return {
    sendMessage,
    cancelStreaming,
    streaming,
    streamingContent,
  };
}
