'use client';

import { useState } from 'react';

interface Props {
  me: { id: string; username: string } | null;
}

export default function WeeklySummary({ me }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState('');

  async function fetchSummary() {
    if (summary) { setOpen(true); return; }
    setOpen(true);
    setLoading(true);
    setEmpty(false);
    setError('');
    setSummary('');

    try {
      const res = await fetch('/api/summary');
      if (res.status === 401) { setError('请先登录后查看周报'); setLoading(false); return; }
      if (!res.ok) { setError('生成失败，请稍后重试'); setLoading(false); return; }

      const contentType = res.headers.get('Content-Type') ?? '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.empty) { setEmpty(true); setLoading(false); return; }
        setError(data.error ?? '未知错误');
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setError('流式读取失败'); setLoading(false); return; }
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setSummary(text);
      }
    } catch {
      setError('网络错误，请重试');
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={fetchSummary}
        title="AI 周报"
        style={{
          position: 'fixed',
          right: 20,
          bottom: 88,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#6e56cf,#4f46e5)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(110,86,207,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          zIndex: 45,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(110,86,207,0.7)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(110,86,207,0.5)'; }}
      >
        ✦
      </button>

      {/* Slide-in panel */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 48 }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '100%',
              maxWidth: 380,
              background: '#16161e',
              borderLeft: '1px solid #2a2a3a',
              boxShadow: '-16px 0 48px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Panel header */}
            <div style={{ borderBottom: '1px solid #1e1e28', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ background: 'linear-gradient(135deg,#6e56cf,#4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 16, fontWeight: 800 }}>
                ✦ AI 周报
              </span>
              {me && (
                <span style={{ color: '#555', fontSize: 12, marginLeft: 2 }}>
                  {me.username} 的本周足迹
                </span>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 4 }}
                className="hover:text-white transition-colors"
              >✕</button>
            </div>

            {/* Refresh button */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #1a1a22', flexShrink: 0 }}>
              <button
                onClick={async () => { setSummary(''); setEmpty(false); setError(''); await fetchSummary(); }}
                disabled={loading}
                style={{
                  background: loading ? '#1e1e2a' : 'linear-gradient(135deg,#6e56cf,#4f46e5)',
                  border: 'none', borderRadius: 8, color: 'white', padding: '6px 14px', fontSize: 12,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
                  fontWeight: 600, transition: 'opacity 0.15s',
                }}
              >
                {loading ? '生成中…' : '重新生成'}
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', color: '#c4c4d4', fontSize: 14, lineHeight: 1.7 }}>
              {loading && !summary && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #6e56cf', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ color: '#555', fontSize: 13 }}>AI 正在回顾你的一周…</p>
                </div>
              )}
              {empty && (
                <div style={{ textAlign: 'center', paddingTop: 40 }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>🗓</p>
                  <p style={{ color: '#555' }}>过去一周还没有留下任何 Ping</p>
                  <p style={{ color: '#333', fontSize: 12, marginTop: 6 }}>出门走走，留下你的足迹吧</p>
                </div>
              )}
              {error && (
                <div style={{ background: '#ef444418', border: '1px solid #ef444433', borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: 13 }}>
                  {error}
                </div>
              )}
              {summary && (
                <div style={{ whiteSpace: 'pre-wrap' }}>{summary}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
