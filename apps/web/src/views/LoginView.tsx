import React, { useState } from 'react';
import { useSessionStore } from '../stores/session';
import { api, setAuthToken } from '../utils/api';

interface Props {
  onLogin: () => void;
}

export function LoginView({ onLogin }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useSessionStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const result = isRegister
        ? await api.register({ username, email, password })
        : await api.login({ email, password });

      setAuthToken(result.token);
      setUser(result.user);
      onLogin();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
            AI Dungeon Master
          </h1>
          <p className="text-gray-500">你的 AI 驱动的开放世界文字 RPG</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h2 className="text-xl font-semibold text-gray-200 text-center">
            {isRegister ? '创建账号' : '欢迎回来'}
          </h2>

          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">用户名</label>
              <input
                type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-500"
                placeholder="冒险者之名" required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">邮箱</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-500"
              placeholder="your@email.com" required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">密码</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-500"
              placeholder="••••••••" required minLength={6}
            />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</p>}

          <button type="submit"
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors">
            {isRegister ? '注册并开始冒险' : '进入世界'}
          </button>

          <p className="text-center text-gray-500 text-sm">
            {isRegister ? '已有账号？' : '没有账号？'}
            <button type="button" onClick={() => setIsRegister(!isRegister)}
              className="text-purple-400 hover:text-purple-300 ml-1">
              {isRegister ? '登录' : '注册'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
