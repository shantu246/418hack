'use client';

import type { Message } from '@/types/message';
import { AVATARS, PING_TYPE_META } from '@/types/message';

interface Props {
  messages: Message[];
  onOpenPing?: (msg: Message) => void;
}

function formatDistance(meters?: number): string {
  if (meters == null) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function MessageList({ messages, onOpenPing }: Props) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 gap-2">
        <span className="text-3xl opacity-30">📍</span>
        <p className="text-sm" style={{ color: '#444' }}>附近 500m 内暂无 Ping，成为第一个留下印记的人</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {messages.map((msg) => {
        const meta = PING_TYPE_META[msg.ping_type] ?? PING_TYPE_META.classic;
        const avatar = AVATARS[msg.avatar_id ?? 0] ?? '📍';
        const isUnlockable = (msg.distance_meters ?? Infinity) <= 50;
        const clickable = isUnlockable && !!onOpenPing;

        return (
          <div
            key={msg.id}
            onClick={() => clickable && onOpenPing!(msg)}
            style={{
              background: '#16161e',
              border: `1px solid ${clickable ? '#2a2a3a' : '#1a1a22'}`,
              borderRadius: 14,
              cursor: clickable ? 'pointer' : 'default',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            className="p-4 group"
            onMouseEnter={e => { if (clickable) { (e.currentTarget as HTMLDivElement).style.borderColor = '#6e56cf66'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 1px #6e56cf22'; } }}
            onMouseLeave={e => { if (clickable) { (e.currentTarget as HTMLDivElement).style.borderColor = '#2a2a3a'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; } }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{avatar}</span>
              <span className="font-medium text-sm text-white">{msg.nickname}</span>
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium ml-1"
                style={{ background: meta.color + 'bb' }}>
                {meta.label}
              </span>
              <span className="text-xs ml-auto font-mono" style={{ color: '#555' }}>{formatDistance(msg.distance_meters)}</span>
            </div>

            {isUnlockable ? (
              <>
                <p className="text-sm leading-relaxed" style={{ color: '#c4c4d4' }}>{msg.content}</p>
                {msg.image_url && (
                  <img src={msg.image_url} alt="ping图片" className="mt-2 w-full object-cover" style={{ borderRadius: 10, maxHeight: 192 }} />
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#333' }}>🔒</span>
                <p className="text-xs italic" style={{ color: '#3a3a4a' }}>靠近 50m 内才能解锁此 Ping</p>
              </div>
            )}

            <p className="text-xs mt-2" suppressHydrationWarning style={{ color: '#3a3a4a' }}>{formatTime(msg.created_at)}</p>
          </div>
        );
      })}
    </div>
  );
}
