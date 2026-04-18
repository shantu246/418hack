'use client';

import Link from 'next/link';
import { useState } from 'react';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? '操作失败');
      return;
    }

    location.href = '/';
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-sm mx-auto mt-16 bg-gray-900 p-6 rounded-xl border border-gray-800">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm ${mode === 'login' ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            登录
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-lg text-sm ${mode === 'register' ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            注册
          </button>
        </div>

        <h1 className="text-xl font-bold mb-4">{mode === 'login' ? '登录你的账号' : '注册新账号'}</h1>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700"
            placeholder="用户名（3-20，不可重复）"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700"
            placeholder="密码（至少 6 位）"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={loading} className="py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60">
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <Link href="/" className="inline-block mt-4 text-sm text-gray-400 hover:text-gray-200">
          返回首页
        </Link>
      </div>
    </main>
  );
}
