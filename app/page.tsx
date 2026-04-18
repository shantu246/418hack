'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Message } from '@/types/message';
import { AVATARS, PING_TYPE_META } from '@/types/message';
import { supabase } from '@/lib/supabase';
import { haversineMeters } from '@/lib/geo';
import MessageList from '@/components/MessageList';
import PostMessageForm from '@/components/PostMessageForm';
import LocationStatus from '@/components/LocationStatus';
import CommentSection from '@/components/CommentSection';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type GeoStatus = 'idle' | 'loading' | 'success' | 'error';

export default function HomePage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [geoError, setGeoError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [openedPing, setOpenedPing] = useState<Message | null>(null);
  const [me, setMe] = useState<{ id: string; username: string } | null>(null);

  const fetchMessages = useCallback(async (lat: number, lng: number) => {
    const res = await fetch(`/api/messages?lat=${lat}&lng=${lng}&radius=500`);
    if (res.ok) setMessages(await res.json());
  }, []);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return data.user as { id: string; username: string };
      })
      .then((user) => setMe(user))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setTimeout(() => {
        setGeoStatus('error');
        setGeoError('浏览器不支持 Geolocation API');
      }, 0);
      return;
    }
    setTimeout(() => setGeoStatus('loading'), 0);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setGeoStatus('success');
        fetchMessages(latitude, longitude);
      },
      (err) => {
        setTimeout(() => {
          setGeoStatus('error');
          setGeoError(err.message);
        }, 0);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchMessages]);

  useEffect(() => {
    if (!coords) return;
    const channel = supabase
      .channel('pings-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as Message;
        const dist = haversineMeters(coords.lat, coords.lng, newMsg.lat, newMsg.lng);
        if (dist <= 500) {
          newMsg.distance_meters = dist;
          setMessages((prev) => [newMsg, ...prev]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [coords]);

  async function handleOpenPing(msg: Message) {
    await fetch('/api/messages/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: msg.id }),
    });
    if (msg.ping_type === 'mirage') {
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    }
    setOpenedPing(msg);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="px-4 py-3 flex items-center gap-2 border-b border-gray-800">
        <span className="text-2xl font-black tracking-tight text-white">ping</span>
        <span className="text-gray-500 text-sm ml-auto">在你所在之处留下印记</span>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm">
          {me ? (
            <>
              <span className="text-gray-300">已登录：{me.username}</span>
              <button
                className="ml-auto px-3 py-1.5 rounded bg-gray-800 border border-gray-700"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  setMe(null);
                }}
              >
                退出
              </button>
            </>
          ) : (
            <>
              <span className="text-gray-400">未登录</span>
              <a href="/auth" className="ml-auto px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500">
                登录/注册
              </a>
            </>
          )}
        </div>

        <LocationStatus status={geoStatus} error={geoError} />

        {coords && (
          <MapView
            userLat={coords.lat}
            userLng={coords.lng}
            messages={messages}
            onOpenPing={handleOpenPing}
          />
        )}

        {coords && me && (
          <PostMessageForm
            userLat={coords.lat}
            userLng={coords.lng}
            onPosted={(msg) => setMessages((prev) => [msg, ...prev])}
          />
        )}

        {coords && !me && (
          <p className="text-center text-gray-500 text-sm py-2">
            <a href="/auth" className="text-blue-400 hover:underline">登录</a> 后才能留下 Ping
          </p>
        )}

        <section>
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-2">附近 500m 的 Pings</h2>
          <MessageList messages={messages} onOpenPing={handleOpenPing} />
        </section>
      </div>

      {openedPing && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6"
          onClick={() => setOpenedPing(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{AVATARS[openedPing.avatar_id ?? 0]}</span>
              <div>
                <p className="font-semibold">{openedPing.nickname}</p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white"
                  style={{ background: PING_TYPE_META[openedPing.ping_type].color }}
                >
                  {PING_TYPE_META[openedPing.ping_type].label}
                </span>
              </div>
            </div>
            <p className="text-gray-200 leading-relaxed">{openedPing.content}</p>
            {openedPing.image_url && (
              <img src={openedPing.image_url} alt="ping图片" className="mt-3 w-full rounded-lg max-h-60 object-cover" />
            )}
            {openedPing.ping_type === 'mirage' && (
              <p className="text-amber-400 text-xs mt-3">此 Ping 已消失，无法再次查看</p>
            )}
            <CommentSection messageId={openedPing.id} me={me} />
            <button
              onClick={() => setOpenedPing(null)}
              className="mt-4 w-full py-2 rounded-lg bg-gray-700 text-sm hover:bg-gray-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
