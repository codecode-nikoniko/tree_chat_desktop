import React, { useState, useEffect } from 'react';
import { PROVIDERS } from '../../utils/providers';

function SettingsModal({ settings, onSave, onClose }) {
  const [form, setForm] = useState({
    provider: settings.provider || 'openai',
    baseUrl: settings.baseUrl || 'https://api.openai.com/v1',
    model: settings.model || 'gpt-4o',
    apiKey: settings.apiKeys?.[settings.provider] || '',
  });

  const [apiKeys] = useState(settings.apiKeys || {});
  const [customProviders, setCustomProviders] = useState(settings.customProviders || {});
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newCustomProvider, setNewCustomProvider] = useState({
    name: '',
    baseUrl: '',
    model: '',
  });

  const isCustomProvider = form.provider === 'custom' || form.provider.startsWith('custom_');

  const handleProviderChange = (provider) => {
    if (provider === 'custom') {
      setShowCustomForm(true);
      return;
    }

    setShowCustomForm(false);

    const providerConfig = PROVIDERS[provider];
    if (providerConfig) {
      setForm({
        provider,
        baseUrl: providerConfig.baseUrl,
        model: providerConfig.model,
        apiKey: apiKeys[provider] || '',
      });
    } else if (customProviders[provider]) {
      const customConfig = customProviders[provider];
      setForm({
        provider,
        baseUrl: customConfig.baseUrl,
        model: customConfig.model,
        apiKey: apiKeys[provider] || '',
      });
    }
  };

  const handleCustomProviderSave = () => {
    if (!newCustomProvider.name || !newCustomProvider.baseUrl || !newCustomProvider.model) {
      return;
    }
    const customKey = 'custom_' + Date.now();
    const updated = {
      ...customProviders,
      [customKey]: {
        ...newCustomProvider,
        supportsStreaming: true,
      },
    };
    setCustomProviders(updated);
    setForm({
      provider: customKey,
      baseUrl: newCustomProvider.baseUrl,
      model: newCustomProvider.model,
      apiKey: apiKeys[customKey] || '',
    });
    setShowCustomForm(false);
    setNewCustomProvider({ name: '', baseUrl: '', model: '' });
  };

  const handleSubmit = () => {
    const updatedApiKeys = {
      ...apiKeys,
      [form.provider]: form.apiKey || apiKeys[form.provider] || '',
    };

    onSave({
      provider: form.provider,
      baseUrl: form.baseUrl,
      model: form.model,
      apiKeys: updatedApiKeys,
      customProviders,
    });
    onClose();
  };

  const handleProviderSelect = (provider) => {
    if (provider === 'custom') {
      setShowCustomForm(true);
      return;
    }
    setShowCustomForm(false);
    handleProviderChange(provider);
  };

  const handleDeleteCustomProvider = (customKey) => {
    const newCustomProviders = { ...customProviders };
    delete newCustomProviders[customKey];
    setCustomProviders(newCustomProviders);

    const newApiKeys = { ...apiKeys };
    delete newApiKeys[customKey];

    // 如果当前正在使用被删除的 provider，切换到 openai
    if (form.provider === customKey) {
      const openaiConfig = PROVIDERS['openai'];
      setForm({
        provider: 'openai',
        baseUrl: openaiConfig.baseUrl,
        model: openaiConfig.model,
        apiKey: newApiKeys['openai'] || '',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
      <div className="bg-gray-800 rounded-xl max-w-md w-full mx-4 modal-content">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <span>⚙️</span> API 设置
          </h2>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Provider 选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">API Provider</label>
            <select
              value={form.provider}
              onChange={(e) => handleProviderSelect(e.target.value)}
              className="w-full bg-gray-700 text-gray-100 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            >
              <option value="">选择 Provider...</option>
              {Object.entries(PROVIDERS).map(([key, p]) => (
                <option key={key} value={key}>{p.name}</option>
              ))}
              {Object.keys(customProviders).length > 0 && (
                <optgroup label="自定义">
                  {Object.entries(customProviders).map(([key, p]) => (
                    <option key={key} value={key}>{p.name} ✕</option>
                  ))}
                </optgroup>
              )}
              <option value="custom">+ 添加自定义 Provider</option>
            </select>
          </div>

          {/* 自定义 Provider 表单 */}
          {showCustomForm && (
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-300">新增自定义 Provider</h4>
              <div>
                <label className="block text-xs text-gray-400 mb-1">名称</label>
                <input
                  type="text"
                  value={newCustomProvider.name}
                  onChange={(e) => setNewCustomProvider({ ...newCustomProvider, name: e.target.value })}
                  placeholder="如: 通义千问"
                  className="w-full bg-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Base URL</label>
                <input
                  type="text"
                  value={newCustomProvider.baseUrl}
                  onChange={(e) => setNewCustomProvider({ ...newCustomProvider, baseUrl: e.target.value })}
                  placeholder="https://api.example.com/v1"
                  className="w-full bg-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">模型</label>
                <input
                  type="text"
                  value={newCustomProvider.model}
                  onChange={(e) => setNewCustomProvider({ ...newCustomProvider, model: e.target.value })}
                  placeholder="如: qwen-turbo"
                  className="w-full bg-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
              <button
                onClick={handleCustomProviderSave}
                disabled={!newCustomProvider.name || !newCustomProvider.baseUrl || !newCustomProvider.model}
                className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                添加
              </button>
            </div>
          )}

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key {isCustomProvider ? '' : `(${PROVIDERS[form.provider]?.name || customProviders[form.provider]?.name || '自定义'})`}
            </label>
            <input
              type="password"
              value={form.apiKey || ''}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder={apiKeys[form.provider] ? '已保存，可修改' : '输入 API Key'}
              className="w-full bg-gray-700 text-gray-100 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-gray-500"
            />
            {apiKeys[form.provider] && !form.apiKey && (
              <p className="text-xs text-gray-500 mt-1">已保存过此 Key</p>
            )}
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Base URL</label>
            <input
              type="text"
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="w-full bg-gray-700 text-gray-100 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-gray-500"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">模型</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="gpt-4o"
              className="w-full bg-gray-700 text-gray-100 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-gray-500"
            />
          </div>

          {/* 已保存的 API Keys */}
          {(Object.keys(apiKeys).length > 0 || Object.keys(customProviders).length > 0) && (
            <div className="pt-2 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-2">已保存的 API Keys：</p>
              <div className="space-y-1">
                {/* 自定义 Provider 显示区 */}
                {Object.entries(customProviders).map(([key, p]) => (
                  <div key={key} className="flex items-center justify-between text-xs bg-gray-700/30 rounded px-2 py-1">
                    <span className="text-gray-400">
                      {p.name}: {apiKeys[key] ? '******' + String(apiKeys[key]).slice(-4) : '未设置'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleProviderSelect(key)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        使用
                      </button>
                      <button
                        onClick={() => handleDeleteCustomProvider(key)}
                        className="text-red-400 hover:text-red-300"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
                {/* 其他 Provider 的 Keys */}
                {Object.entries(apiKeys)
                  .filter(([key]) => !PROVIDERS[key] && !customProviders[key])
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs bg-gray-700/30 rounded px-2 py-1">
                      <span className="text-gray-400">
                        {key}: {value ? '******' + value.slice(-4) : '未设置'}
                      </span>
                      <button
                        onClick={() => handleProviderSelect(key)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        使用
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
