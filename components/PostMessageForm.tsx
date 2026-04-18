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
  const [nickname, setNickname] = useState('');
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
    if (file.size > 5 * 1024 * 1024) {
      setError('图片不能超过 5MB');
      return;
    }
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
    const { error } = await supabase.storage.from('ping-images').upload(path, file, {
      contentType: file.type,
    });
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
      try {
        image_url = await uploadImage(imageFile);
      } catch (err: any) {
        setError('图片上传失败：' + err.message);
        setLoading(false);
        return;
      }
    }

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        nickname: nickname || 'Anonymous',
        avatar_id: avatarId,
        ping_type: pingType,
        image_url,
        lat: userLat,
        lng: userLng,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? '发送失败，请重试');
      return;
    }

    const msg: Message = await res.json();
    onPosted(msg);
    setContent('');
    setImageFile(null);
    setImagePreview(null);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium text-sm shadow transition-colors"
      >
        + 在此处留下 Ping
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-white rounded-xl shadow">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800">发送 Ping</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 text-sm">取消</button>
      </div>

      {/* Avatar picker */}
      <div>
        <p className="text-xs text-gray-500 mb-1">选择头像</p>
        <div className="flex gap-2">
          {AVATARS.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAvatarId(i)}
              className={`w-9 h-9 text-xl rounded-full border-2 transition-colors ${
                avatarId === i ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-100'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="昵称（可选）"
        maxLength={30}
        className="border rounded px-3 py-1.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* Ping type selector */}
      <div>
        <p className="text-xs text-gray-500 mb-1">类型</p>
        <div className="flex gap-2">
          {(Object.entries(PING_TYPE_META) as [PingType, typeof PING_TYPE_META[PingType]][]).map(([type, meta]) => (
            <button
              key={type}
              type="button"
              onClick={() => setPingType(type)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition-colors ${
                pingType === type
                  ? 'text-white border-transparent'
                  : 'text-gray-600 border-gray-200 bg-white'
              }`}
              style={pingType === type ? { background: meta.color, borderColor: meta.color } : {}}
            >
              {meta.label}
              <br />
              <span className="font-normal opacity-75">{meta.desc}</span>
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
        className="border rounded px-3 py-1.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* Image upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          className="hidden"
          id="image-upload"
        />
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="预览" className="w-full rounded-lg max-h-48 object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ) : (
          <label
            htmlFor="image-upload"
            className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer text-gray-500 text-sm hover:border-blue-400 hover:text-blue-400 transition-colors"
          >
            <span>📷</span>
            <span>拍照 / 选择图片（可选，最大 5MB）</span>
          </label>
        )}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">{content.length}/500</span>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition-colors"
        style={{ background: PING_TYPE_META[pingType].color }}
      >
        {loading ? (imageFile ? '上传图片中...' : '发送中...') : `留下这个 ${PING_TYPE_META[pingType].label} Ping`}
      </button>
    </form>
  );
}
