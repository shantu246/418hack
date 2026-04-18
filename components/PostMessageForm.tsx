'use client';

import { useRef, useState } from 'react';
import type { Message, PingType } from '@/types/message';
import { PING_TYPE_META, AVATARS } from '@/types/message';
import { supabase } from '@/lib/supabase';

interface Props {
  userLat: number;
  userLng: number;
  onPosted: (msg: Message) => void;
}

export default function PostMessageForm({ userLat, userLng, onPosted }: Props) {
  const [content, setContent] = useState('');
  const [avatarId, setAvatarId] = useState(0);
  const [pingType, setPingType] = useState<PingType>('classic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('图片不能超过 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('ping-images').upload(path, file, { contentType: file.type });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('ping-images').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');

    let image_url: string | null = null;
    if (imageFile) {
      try { image_url = await uploadImage(imageFile); }
      catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError('图片上传失败：' + message);
        setLoading(false);
        return;
      }
    }

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, avatar_id: avatarId, ping_type: pingType, image_url, lat: userLat, lng: userLng }),
    });

    setLoading(false);
    if (!res.ok) { const { error: msg } = await res.json(); setError(msg ?? '发送失败，请重试'); return; }
    const msg: Message = await res.json();
    onPosted(msg);
    setContent(''); setImageFile(null); setImagePreview(null); setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ background: 'linear-gradient(135deg,#6e56cf,#4f46e5)', borderRadius: 14, color: 'white', border: 'none' }}
        className="w-full py-3 font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg"
      >
        ✦ 在此处留下 Ping
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4"
      style={{ background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 16 }}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white">发送 Ping</h2>
        <button type="button" onClick={() => setOpen(false)}
          className="text-xs hover:text-white transition-colors" style={{ color: '#555' }}>取消</button>
      </div>

      {/* Avatar picker */}
      <div>
        <p className="text-xs mb-2 font-medium" style={{ color: '#6b6b80' }}>选择头像</p>
        <div className="flex gap-1.5">
          {AVATARS.map((emoji, i) => (
            <button key={i} type="button" onClick={() => setAvatarId(i)}
              style={{
                width: 36, height: 36, borderRadius: 10, fontSize: 18, border: '2px solid',
                borderColor: avatarId === i ? '#6e56cf' : '#2a2a3a',
                background: avatarId === i ? '#6e56cf22' : '#1e1e2a',
                transition: 'all 0.15s',
              }}>
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Ping type selector */}
      <div>
        <p className="text-xs mb-2 font-medium" style={{ color: '#6b6b80' }}>类型</p>
        <div className="flex gap-2">
          {(Object.entries(PING_TYPE_META) as [PingType, typeof PING_TYPE_META[PingType]][]).map(([type, meta]) => (
            <button key={type} type="button" onClick={() => setPingType(type)}
              style={{
                flex: 1, padding: '6px 4px', borderRadius: 10, fontSize: 11, fontWeight: 500,
                border: `2px solid ${pingType === type ? meta.color : '#2a2a3a'}`,
                background: pingType === type ? meta.color + '22' : '#1e1e2a',
                color: pingType === type ? '#fff' : '#888',
                transition: 'all 0.15s',
              }}>
              {meta.label}
              <br />
              <span style={{ opacity: 0.6, fontWeight: 400 }}>{meta.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下你想留在此处的话..."
        maxLength={500}
        rows={3}
        style={{ background: '#1e1e2a', border: '1px solid #2a2a3a', borderRadius: 10, color: 'white', resize: 'none' }}
        className="px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
      />

      {/* Image upload */}
      <div>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
          onChange={handleImageChange} className="hidden" id="image-upload" />
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="预览" className="w-full object-cover" style={{ borderRadius: 10, maxHeight: 192 }} />
            <button type="button" onClick={removeImage}
              style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', borderRadius: '50%', width: 24, height: 24, color: 'white', fontSize: 12, border: '1px solid #444' }}
              className="flex items-center justify-center">✕</button>
          </div>
        ) : (
          <label htmlFor="image-upload"
            style={{ border: '1px dashed #2a2a3a', borderRadius: 10, color: '#555', cursor: 'pointer', transition: 'all 0.15s' }}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:border-purple-600 hover:text-purple-400">
            <span>📷</span>
            <span>拍照 / 选择图片（可选，最大 5MB）</span>
          </label>
        )}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs font-mono" style={{ color: '#3a3a4a' }}>{content.length}/500</span>
        {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
      </div>

      <button type="submit" disabled={loading || !content.trim()}
        style={{ background: `linear-gradient(135deg, ${PING_TYPE_META[pingType].color}, ${PING_TYPE_META[pingType].color}bb)`, borderRadius: 10, color: 'white', border: 'none', opacity: loading || !content.trim() ? 0.4 : 1 }}
        className="py-2.5 text-sm font-semibold transition-opacity hover:opacity-90">
        {loading ? (imageFile ? '上传图片中…' : '发送中…') : `✦ 留下这个 ${PING_TYPE_META[pingType].label} Ping`}
      </button>
    </form>
  );
}
