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
      setTimeout(() => { setGeoStatus('error'); setGeoError('浏览器不支持 Geolocation API'); }, 0);
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
      (err) => { setTimeout(() => { setGeoStatus('error'); setGeoError(err.message); }, 0); },
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
        if (dist <= 500) { newMsg.distance_meters = dist; setMessages((prev) => [newMsg, ...prev]); }
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
    if (msg.ping_type === 'mirage') setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setOpenedPing(msg);
  }

  return (
    <main className="min-h-screen text-white" style={{ background: '#0e0e10' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #1e1e28', background: 'rgba(14,14,16,0.85)', backdropFilter: 'blur(12px)' }}
        className="sticky top-0 z-40 px-5 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span style={{ background: 'linear-gradient(135deg,#6e56cf,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            className="text-2xl font-black tracking-tight">ping</span>
          <span style={{ background: '#6e56cf22', border: '1px solid #6e56cf55', color: '#a78bfa' }}
            className="text-xs px-2 py-0.5 rounded-full font-medium">BETA</span>
        </div>
        <span className="text-sm ml-auto" style={{ color: '#6b6b80' }}>在你所在之处留下印记</span>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Auth bar */}
        <div style={{ background: '#16161e', border: '1px solid #1e1e28', borderRadius: 12 }}
          className="px-4 py-2.5 flex items-center gap-2 text-sm">
          {me ? (
            <>
              <span style={{ color: '#a78bfa' }}>◉</span>
              <span style={{ color: '#c4c4d4' }}>已登录：<span className="font-medium text-white">{me.username}</span></span>
              <button
                style={{ background: '#1e1e2a', border: '1px solid #2a2a3a', color: '#888', borderRadius: 8 }}
                className="ml-auto px-3 py-1 text-xs hover:text-white transition-colors"
                onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); setMe(null); }}
              >退出</button>
            </>
          ) : (
            <>
              <span style={{ color: '#444' }}>○</span>
              <span style={{ color: '#666' }}>未登录</span>
              <a href="/auth"
                style={{ background: 'linear-gradient(135deg,#6e56cf,#4f46e5)', borderRadius: 8, color: 'white' }}
                className="ml-auto px-3 py-1 text-xs font-medium hover:opacity-90 transition-opacity">
                登录 / 注册
              </a>
            </>
          )}
        </div>

        <LocationStatus status={geoStatus} error={geoError} />

        {coords && (
          <MapView userLat={coords.lat} userLng={coords.lng} messages={messages} onOpenPing={handleOpenPing} />
        )}

        {coords && me && (
          <PostMessageForm userLat={coords.lat} userLng={coords.lng} onPosted={(msg) => setMessages((prev) => [msg, ...prev])} />
        )}

        {coords && !me && (
          <p className="text-center text-sm py-2" style={{ color: '#555' }}>
            <a href="/auth" style={{ color: '#a78bfa' }} className="hover:underline">登录</a> 后才能留下 Ping
          </p>
        )}

        <section>
          <div className="flex items-center gap-2 mb-3">
            <div style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#6e56cf,#3b82f6)', borderRadius: 2 }} />
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b6b80' }}>附近 500m 的 Pings</h2>
          </div>
          <MessageList messages={messages} onOpenPing={handleOpenPing} />
        </section>
      </div>

      {/* Ping detail modal */}
      {openedPing && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setOpenedPing(null)}>
          <div
            style={{ background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(110,86,207,0.1)' }}
            className="max-w-sm w-full p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            {/* Ping header */}
            <div className="flex items-center gap-3 mb-4">
              <div style={{ background: '#1e1e2a', borderRadius: 12, width: 44, height: 44 }}
                className="flex items-center justify-center text-2xl flex-shrink-0">
                {AVATARS[openedPing.avatar_id ?? 0]}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{openedPing.nickname}</p>
                <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ background: PING_TYPE_META[openedPing.ping_type].color + 'cc' }}>
                  {PING_TYPE_META[openedPing.ping_type].label}
                </span>
              </div>
              <button onClick={() => setOpenedPing(null)}
                style={{ color: '#555', marginLeft: 'auto', flexShrink: 0 }}
                className="hover:text-white transition-colors text-lg leading-none">✕</button>
            </div>

            <p className="leading-relaxed mb-1" style={{ color: '#c4c4d4' }}>{openedPing.content}</p>
            {openedPing.image_url && (
              <img src={openedPing.image_url} alt="ping图片" className="mt-3 w-full object-cover" style={{ borderRadius: 12, maxHeight: 240 }} />
            )}
            {openedPing.ping_type === 'mirage' && (
              <p className="text-xs mt-3 px-3 py-2 rounded-lg" style={{ background: '#f59e0b18', border: '1px solid #f59e0b44', color: '#fbbf24' }}>
                ✦ 此 Ping 已消失，无法再次查看
              </p>
            )}

            <CommentSection messageId={openedPing.id} me={me} />
          </div>
        </div>
      )}
    </main>
  );
}
