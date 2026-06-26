import React, { useState, useRef, useEffect } from 'react';

interface Props {
  onSend: (input: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) textareaRef.current.focus();
  }, [disabled]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-800 p-4 bg-gray-900/50">
      <div className="flex gap-3 max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你的行动... (Enter 发送, Shift+Enter 换行)"
          rows={2}
          disabled={disabled}
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-500 disabled:opacity-50 text-sm"
        />
        <button type="submit" disabled={disabled || !input.trim()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-xl font-medium transition-colors self-end">
          {disabled ? '生成中...' : '发送'}
        </button>
      </div>
    </form>
  );
}
