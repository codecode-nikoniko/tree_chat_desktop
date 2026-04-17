import React, { useRef, useEffect } from 'react';

function MessageList({ messages, streamingContent }) {
  const listRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const renderMarkdown = (content) => {
    if (window.marked) {
      return { __html: window.marked.parse(content) };
    }
    return { __html: content.replace(/\n/g, '<br>') };
  };

  if (messages.length === 0 && !streamingContent) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">开始对话</p>
          <p className="text-sm">在左侧选择或创建对话节点</p>
          <p className="text-sm">输入你的问题，AI 将开始回答</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-green-600 text-white rounded-br-md'
                : 'bg-gray-700 text-gray-100 rounded-bl-md'
            }`}
          >
            {msg.role === 'user' ? (
              <div className="message-content">
                <p className="m-0">{msg.content}</p>
              </div>
            ) : (
              <div
                className="message-content prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={renderMarkdown(msg.content)}
              />
            )}
          </div>
        </div>
      ))}

      {/* 流式输出 */}
      {streamingContent && (
        <div className="flex justify-start">
          <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-gray-700 text-gray-100 rounded-bl-md">
            <div
              className="message-content prose prose-invert prose-sm max-w-none streaming-cursor"
              dangerouslySetInnerHTML={renderMarkdown(streamingContent)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageList;
