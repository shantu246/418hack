'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Message } from '@/types/message';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN');
}

type AdminUser = {
  id: string;
  username: string;
  created_at: string;
};

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [actionError, setActionError] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string>('');

  const fetchMessages = useCallback(async (filterUsername?: string) => {
    setLoadingMessages(true);
    setActionError('');
    const u = (filterUsername ?? '').trim();
    const res = await fetch(u ? `/api/admin/messages?username=${encodeURIComponent(u)}` : '/api/admin/messages', { cache: 'no-store' });
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
    setSelectedUsername(u);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const res = await fetch('/api/admin/users', { cache: 'no-store' });
    setLoadingUsers(false);

    if (res.status === 401) {
      setAuthed(false);
      setUsers([]);
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setActionError(body.error ?? '获取用户失败');
      return;
    }

    const data: AdminUser[] = await res.json();
    setUsers(data);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fetchMessages();
    }, 0);
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
    fetchUsers();
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthed(false);
    setMessages([]);
    setUsers([]);
    setSelectedUsername('');
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

  async function handleDeleteUser(user: AdminUser) {
    if (!confirm(`确认删除用户 ${user.username} 吗？将同时删除该用户发布的所有 ping，并释放用户名。`)) return;
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setActionError(body.error ?? '删除用户失败');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    if (selectedUsername === user.username) {
      setSelectedUsername('');
      fetchMessages('');
    }
  }

  if (authed === null) {
    return <main className="min-h-screen bg-gray-950 text-white p-6">正在加载后台...</main>;
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-sm mx-auto mt-20 bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h1 className="text-xl font-bold mb-4">管理员登录</h1>
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
            onClick={() => { fetchUsers(); fetchMessages(selectedUsername); }}
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
        {(loadingUsers || loadingMessages) && <p className="text-gray-400 mb-3">正在加载...</p>}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2 border border-gray-800 rounded-xl overflow-hidden">
            <div className="bg-gray-900 px-3 py-2 flex items-center gap-2">
              <span className="text-sm font-semibold">用户</span>
              <span className="text-xs text-gray-500 ml-auto">{users.length}</span>
            </div>
            <div className="max-h-[520px] overflow-auto">
              {users.map((u) => (
                <div key={u.id} className="border-t border-gray-800 px-3 py-2 flex items-center gap-2">
                  <button
                    className={`text-sm ${selectedUsername === u.username ? 'text-white' : 'text-gray-300'} hover:text-white`}
                    onClick={() => { fetchMessages(u.username); }}
                  >
                    {u.username}
                  </button>
                  <span className="text-xs text-gray-600 ml-auto whitespace-nowrap">{formatTime(u.created_at)}</span>
                  <button
                    className="ml-2 px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600"
                    onClick={() => handleDeleteUser(u)}
                  >
                    删除用户
                  </button>
                </div>
              ))}
              {users.length === 0 && !loadingUsers && (
                <div className="p-4 text-sm text-gray-500">暂无注册用户</div>
              )}
            </div>
          </div>

          <div className="md:col-span-3 border border-gray-800 rounded-xl overflow-hidden">
            <div className="bg-gray-900 px-3 py-2 flex items-center gap-2">
              <span className="text-sm font-semibold">
                {selectedUsername ? `pings（${selectedUsername}）` : '全部 pings'}
              </span>
              {selectedUsername && (
                <button
                  className="ml-auto px-2 py-1 text-xs rounded bg-gray-800 border border-gray-700"
                  onClick={() => fetchMessages('')}
                >
                  清除筛选
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-950">
                  <tr className="text-left text-gray-300">
                    <th className="p-3">时间</th>
                    <th className="p-3">用户名</th>
                    <th className="p-3">类型</th>
                    <th className="p-3">内容</th>
                    <th className="p-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg.id} className="border-t border-gray-800 align-top">
                      <td className="p-3 text-gray-300 whitespace-nowrap">{formatTime(msg.created_at)}</td>
                      <td className="p-3">
                        <button
                          className="text-gray-300 hover:text-white"
                          onClick={() => fetchMessages(msg.nickname)}
                        >
                          {msg.nickname}
                        </button>
                      </td>
                      <td className="p-3">{msg.ping_type}</td>
                      <td className="p-3 max-w-lg break-words">{msg.content}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600"
                        >
                          删除 ping
                        </button>
                      </td>
                    </tr>
                  ))}
                  {messages.length === 0 && !loadingMessages && (
                    <tr>
                      <td className="p-6 text-gray-500" colSpan={5}>
                        当前没有任何 ping
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
