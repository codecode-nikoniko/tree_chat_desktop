// API Provider 配置
export const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    supportsStreaming: true,
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-haiku-20240307',
    supportsStreaming: true,
  },
  zhipu: {
    name: '智谱AI (GLM)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    supportsStreaming: true,
  },
  minimax: {
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    model: 'MiniMax-Text-01',
    supportsStreaming: true,
  },
  ollama: {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434',
    model: 'llama3',
    supportsStreaming: true,
  },
};

// 构建请求头
export function buildHeaders(provider, apiKey) {
  const headers = {
    'Content-Type': 'application/json',
  };

  switch (provider) {
    case 'openai':
    case 'zhipu':
    case 'minimax':
      headers['Authorization'] = `Bearer ${apiKey}`;
      break;
    case 'anthropic':
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
      break;
    case 'ollama':
      // ollama 不需要 Authorization header
      break;
    default:
      // 自定义 provider 默认使用 Bearer token
      headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return headers;
}

// 构建请求体
export function buildRequestBody(provider, model, messages) {
  const baseBody = {
    model,
    messages,
    stream: true,
  };

  switch (provider) {
    case 'anthropic':
      return {
        model,
        messages,
        max_tokens: 4096,
        stream: true,
      };
    case 'ollama':
      return {
        model,
        messages,
        stream: true,
      };
    default:
      return baseBody;
  }
}

// 获取 API 端点
export function getEndpoint(provider, baseUrl) {
  switch (provider) {
    case 'openai':
    case 'zhipu':
    case 'minimax':
      return `${baseUrl}/chat/completions`;
    case 'anthropic':
      return `${baseUrl}/v1/messages`;
    case 'ollama':
      return `${baseUrl}/api/chat`;
    default:
      // 自定义 provider 默认使用 OpenAI 兼容格式
      return `${baseUrl}/chat/completions`;
  }
}

// 解析 SSE 流式响应
export function parseStreamChunk(provider, data) {
  try {
    const parsed = JSON.parse(data);

    switch (provider) {
      case 'openai':
      case 'zhipu':
      case 'minimax':
        return parsed.choices?.[0]?.delta?.content || '';
      case 'anthropic':
        if (parsed.type === 'content_block_delta') {
          return parsed.delta?.text || '';
        }
        return '';
      case 'ollama':
        return parsed.message?.content || '';
      default:
        // 自定义 provider 默认使用 OpenAI 兼容格式
        return parsed.choices?.[0]?.delta?.content || '';
    }
  } catch {
    return '';
  }
}
