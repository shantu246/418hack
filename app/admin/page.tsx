'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Message } from '@/types/message';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN');
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loginError, setLoginError] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true);
    setActionError('');
    const res = await fetch('/api/admin/messages', { cache: 'no-store' });
    setLoadingMessages(false);

    if (res.status === 401) {
      setAuthed(false);
      setMessages([]);
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setActionError(body.error ?? '获取 pings 失败');
      return;
    }

    const data: Message[] = await res.json();
    setMessages(data);
    setAuthed(true);
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setLoginError(body.error ?? '登录失败');
      return;
    }
    setAuthed(true);
    fetchMessages();
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthed(false);
    setMessages([]);
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除这条 ping 吗？')) return;
    const res = await fetch(`/api/admin/messages?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setActionError(body.error ?? '删除失败');
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  if (authed === null) {
    return <main className="min-h-screen bg-gray-950 text-white p-6">正在加载后台...</main>;
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-sm mx-auto mt-20 bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h1 className="text-xl font-bold mb-4">管理员登录</h1>
          <p className="text-sm text-gray-400 mb-4">默认账号：admin / admin</p>
          <form className="flex flex-col gap-3" onSubmit={handleLogin}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700"
              placeholder="用户名"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700"
              placeholder="密码"
            />
            {loginError && <p className="text-sm text-red-400">{loginError}</p>}
            <button className="py-2 rounded bg-blue-600 hover:bg-blue-500">登录</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold">Ping 后台管理</h1>
          <button
            onClick={fetchMessages}
            className="px-3 py-1.5 text-sm rounded bg-gray-800 border border-gray-700"
          >
            刷新
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm rounded bg-red-700 hover:bg-red-600 ml-auto"
          >
            退出登录
          </button>
        </div>

        {actionError && <p className="text-red-400 mb-3">{actionError}</p>}
        {loadingMessages && <p className="text-gray-400 mb-3">正在加载 pings...</p>}

        <div className="overflow-x-auto border border-gray-800 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-900">
              <tr className="text-left text-gray-300">
                <th className="p-3">时间</th>
                <th className="p-3">昵称</th>
                <th className="p-3">类型</th>
                <th className="p-3">内容</th>
                <th className="p-3">坐标</th>
                <th className="p-3">状态</th>
                <th className="p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.id} className="border-t border-gray-800 align-top">
                  <td className="p-3 text-gray-300 whitespace-nowrap">{formatTime(msg.created_at)}</td>
                  <td className="p-3">{msg.nickname}</td>
                  <td className="p-3">{msg.ping_type}</td>
                  <td className="p-3 max-w-lg break-words">{msg.content}</td>
                  <td className="p-3 text-xs text-gray-400">
                    {msg.lat.toFixed(6)}, {msg.lng.toFixed(6)}
                  </td>
                  <td className="p-3">{msg.is_burned ? '已焚毁' : '正常'}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {messages.length === 0 && !loadingMessages && (
                <tr>
                  <td className="p-6 text-gray-500" colSpan={7}>
                    当前没有任何 ping
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
