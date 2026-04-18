'use client';

import type { Message } from '@/types/message';
import { AVATARS, PING_TYPE_META } from '@/types/message';

interface Props {
  messages: Message[];
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

export default function MessageList({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-600 py-10 text-sm">
        附近 500m 内暂无 Ping，成为第一个留下印记的人
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {messages.map((msg) => {
        const meta = PING_TYPE_META[msg.ping_type] ?? PING_TYPE_META.classic;
        const avatar = AVATARS[msg.avatar_id ?? 0] ?? '📍';
        const isUnlockable = (msg.distance_meters ?? Infinity) <= 50;

        return (
          <div key={msg.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{avatar}</span>
              <span className="font-medium text-sm">{msg.nickname}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full text-white ml-1"
                style={{ background: meta.color }}
              >
                {meta.label}
              </span>
              <span className="text-xs text-gray-500 ml-auto">{formatDistance(msg.distance_meters)}</span>
            </div>

            {isUnlockable ? (
              <>
                <p className="text-gray-200 text-sm leading-relaxed">{msg.content}</p>
                {msg.image_url && (
                  <img src={msg.image_url} alt="ping图片" className="mt-2 w-full rounded-lg max-h-48 object-cover" />
                )}
              </>
            ) : (
              <p className="text-gray-600 text-sm italic">靠近 50m 内才能解锁此 Ping</p>
            )}

            <p className="text-xs text-gray-600 mt-2">{formatTime(msg.created_at)}</p>
          </div>
        );
      })}
    </div>
  );
}
