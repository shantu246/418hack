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
    if (!res.ok) { const body = await res.json().catch(() => ({})); setError(body.error ?? '操作失败'); return; }
    location.href = '/';
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0e0e10' }}>
      {/* Glow bg */}
      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, background: 'radial-gradient(circle, #6e56cf18 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="w-full max-w-sm" style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <span style={{ background: 'linear-gradient(135deg,#6e56cf,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            className="text-4xl font-black tracking-tight">ping</span>
          <p className="text-sm mt-1" style={{ color: '#555' }}>在你所在之处留下印记</p>
        </div>

        <div style={{ background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 20, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          {/* Tab switcher */}
          <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: '#1e1e2a' }}>
            {(['login', 'register'] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: mode === m ? 'linear-gradient(135deg,#6e56cf,#4f46e5)' : 'transparent',
                  color: mode === m ? 'white' : '#555',
                  border: 'none', transition: 'all 0.15s',
                }}>
                {m === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6b6b80' }}>用户名</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="3-20 个字符，不可重复"
                style={{ background: '#1e1e2a', border: '1px solid #2a2a3a', borderRadius: 10, color: 'white', width: '100%' }}
                className="px-3 py-2.5 text-sm placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6b6b80' }}>密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位"
                style={{ background: '#1e1e2a', border: '1px solid #2a2a3a', borderRadius: 10, color: 'white', width: '100%' }}
                className="px-3 py-2.5 text-sm placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            {error && (
              <div className="px-3 py-2 rounded-lg text-sm" style={{ background: '#ef444418', border: '1px solid #ef444433', color: '#f87171' }}>
                {error}
              </div>
            )}

            <button disabled={loading}
              style={{ background: 'linear-gradient(135deg,#6e56cf,#4f46e5)', borderRadius: 10, color: 'white', border: 'none', padding: '11px 0', fontSize: 14, fontWeight: 600, opacity: loading ? 0.6 : 1, marginTop: 4 }}
              className="hover:opacity-90 transition-opacity">
              {loading ? '处理中…' : mode === 'login' ? '登录' : '注册账号'}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm hover:text-white transition-colors" style={{ color: '#444' }}>
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
