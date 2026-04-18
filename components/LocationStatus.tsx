'use client';

interface Props {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

export default function LocationStatus({ status, error }: Props) {
  if (status === 'loading') return (
    <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
      style={{ background: '#6e56cf18', border: '1px solid #6e56cf33', color: '#a78bfa' }}>
      <span className="animate-pulse">◉</span> 正在获取位置…
    </div>
  );
  if (status === 'error') return (
    <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
      style={{ background: '#ef444418', border: '1px solid #ef444433', color: '#f87171' }}>
      ✕ 定位失败：{error ?? '请允许浏览器访问位置信息'}
    </div>
  );
  if (status === 'success') return (
    <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
      style={{ background: '#22c55e18', border: '1px solid #22c55e33', color: '#4ade80' }}>
      ✓ 已定位
    </div>
  );
  return null;
}
