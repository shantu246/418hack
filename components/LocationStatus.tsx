'use client';

interface Props {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

export default function LocationStatus({ status, error }: Props) {
  if (status === 'loading') return <p className="text-blue-500 text-sm">正在获取位置...</p>;
  if (status === 'error') return <p className="text-red-500 text-sm">定位失败：{error ?? '请允许浏览器访问位置信息'}</p>;
  if (status === 'success') return <p className="text-green-500 text-sm">已定位</p>;
  return null;
}
