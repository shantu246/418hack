'use client';

import { useEffect, useRef, useState } from 'react';
import { AVATARS } from '@/types/message';

interface Comment {
  id: string;
  message_id: string;
  nickname: string;
  avatar_id: number;
  content: string;
  created_at: string;
}

interface Props {
  messageId: string;
  me: { id: string; username: string } | null;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function CommentSection({ messageId, me }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/messages/${messageId}/comments`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setComments(data))
      .catch(() => {});
  }, [messageId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError('');
    const res = await fetch(`/api/messages/${messageId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.trim(), avatar_id: 0 }),
    });
    setSending(false);
    if (!res.ok) { const body = await res.json().catch(() => ({})); setError(body.error ?? '评论失败'); return; }
    const newComment: Comment = await res.json();
    setComments((prev) => [...prev, newComment]);
    setText('');
  }

  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid #1e1e28' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#444' }}>
        评论 · {comments.length}
      </p>

      <div className="flex flex-col gap-3 max-h-40 overflow-y-auto mb-3 pr-1">
        {comments.length === 0 && (
          <p className="text-xs italic" style={{ color: '#333' }}>还没有评论，来说第一句话</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <span style={{ background: '#1e1e2a', borderRadius: 8, width: 26, height: 26, fontSize: 14, flexShrink: 0 }}
              className="flex items-center justify-center">
              {AVATARS[c.avatar_id ?? 0]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-xs font-medium text-white">{c.nickname}</span>
                <span className="text-xs" suppressHydrationWarning style={{ color: '#333' }}>{formatTime(c.created_at)}</span>
              </div>
              <p className="text-sm leading-snug break-words" style={{ color: '#c4c4d4' }}>{c.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {me ? (
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="写下你的评论…"
            maxLength={200}
            style={{ background: '#1e1e2a', border: '1px solid #2a2a3a', borderRadius: 10, color: 'white', flex: 1 }}
            className="px-3 py-1.5 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
          />
          <button type="submit" disabled={sending || !text.trim()}
            style={{ background: 'linear-gradient(135deg,#6e56cf,#4f46e5)', borderRadius: 10, color: 'white', border: 'none', padding: '6px 14px', fontSize: 13, opacity: sending || !text.trim() ? 0.4 : 1 }}
            className="font-medium transition-opacity hover:opacity-90">
            {sending ? '…' : '发送'}
          </button>
        </form>
      ) : (
        <p className="text-xs" style={{ color: '#444' }}>
          <a href="/auth" style={{ color: '#a78bfa' }} className="hover:underline">登录</a> 后才能评论
        </p>
      )}
      {error && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  );
}
