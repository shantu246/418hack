export type PingType = 'classic' | 'whisper' | 'mirage';

export interface Message {
  id: string;
  content: string;
  nickname: string;
  avatar_id: number;
  ping_type: PingType;
  lat: number;
  lng: number;
  created_at: string;
  distance_meters?: number;
  is_burned?: boolean;
}

export const PING_TYPE_META: Record<PingType, { label: string; desc: string; color: string }> = {
  classic: { label: '经典', desc: '永久保留的记忆', color: '#3b82f6' },
  whisper: { label: '私语', desc: '仅限一人查看', color: '#8b5cf6' },
  mirage: { label: '幻影', desc: '阅后即焚', color: '#f59e0b' },
};

export const AVATARS = ['🐼', '🦊', '🐧', '🦋', '🌸', '⚡', '🌊', '🔮'];
