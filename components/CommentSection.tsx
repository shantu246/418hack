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
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? '评论失败');
      return;
    }
    const newComment: Comment = await res.json();
    setComments((prev) => [...prev, newComment]);
    setText('');
  }

  return (
    <div className="mt-4 border-t border-gray-700 pt-3">
      <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">评论 · {comments.length}</p>

      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto mb-3 pr-1">
        {comments.length === 0 && (
          <p className="text-xs text-gray-600 italic">还没有评论，来说第一句话</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">{AVATARS[c.avatar_id ?? 0]}</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-300">{c.nickname}</span>
              <span className="text-xs text-gray-600 ml-2">{formatTime(c.created_at)}</span>
              <p className="text-sm text-gray-200 leading-snug break-words">{c.content}</p>
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
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white disabled:opacity-40 transition-colors"
          >
            {sending ? '…' : '发送'}
          </button>
        </form>
      ) : (
        <p className="text-xs text-gray-500">
          <a href="/auth" className="text-blue-400 hover:underline">登录</a> 后才能评论
        </p>
      )}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
