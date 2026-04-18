'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/types/message';
import { AVATARS } from '@/types/message';

interface Props {
  userLat: number;
  userLng: number;
  messages: Message[];
  onOpenPing: (msg: Message) => void;
}

const UNLOCK_RADIUS = 50; // meters — exact marker shown within this distance
const RADAR_RADIUS = 500; // meters — heatmap range

export default function MapView({ userLat, userLng, messages, onOpenPing }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const heatmapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Set security code before loading
    (window as any)._AMapSecurityConfig = {
      securityJsCode: process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE,
    };

    import('@amap/amap-jsapi-loader').then((module) => {
      const AMapLoader = module.default;
      AMapLoader.load({
        key: process.env.NEXT_PUBLIC_AMAP_KEY!,
        version: '2.0',
        plugins: ['AMap.HeatMap', 'AMap.Geolocation'],
      }).then((AMap: any) => {
        const map = new AMap.Map(mapRef.current!, {
          zoom: 16,
          center: [userLng, userLat],
          mapStyle: 'amap://styles/dark',
        });
        mapInstanceRef.current = map;

        // User location marker
        const userMarker = new AMap.Marker({
          position: [userLng, userLat],
          content: `<div style="
            width:18px;height:18px;
            background:#3b82f6;border-radius:50%;
            border:3px solid white;
            box-shadow:0 0 8px rgba(59,130,246,0.8)">
          </div>`,
          offset: new AMap.Pixel(-9, -9),
        });
        userMarker.setMap(map);

        // Heatmap for all pings in radar range
        const heatmap = new AMap.HeatMap(map, {
          radius: 30,
          opacity: [0, 0.8],
          gradient: { 0.4: '#8b5cf6', 0.7: '#f59e0b', 1.0: '#ef4444' },
        });
        heatmapRef.current = heatmap;

        renderPings(AMap, map, heatmap, messages);
      });
    });

    return () => {
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
    };
  }, []);

  // Re-render when messages change
  useEffect(() => {
    if (!mapInstanceRef.current || !heatmapRef.current) return;
    import('@amap/amap-jsapi-loader').then((module) => {
      const AMapLoader = module.default;
      AMapLoader.load({
        key: process.env.NEXT_PUBLIC_AMAP_KEY!,
        version: '2.0',
      }).then((AMap: any) => {
        // Clear old markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        renderPings(AMap, mapInstanceRef.current, heatmapRef.current, messages);
      });
    });
  }, [messages]);

  function renderPings(AMap: any, map: any, heatmap: any, msgs: Message[]) {
    const heatData: { lng: number; lat: number; count: number }[] = [];

    msgs.forEach((msg) => {
      // Always add to heatmap (slightly fuzzed for privacy)
      heatData.push({
        lng: msg.lng + (Math.random() - 0.5) * 0.0003,
        lat: msg.lat + (Math.random() - 0.5) * 0.0003,
        count: 1,
      });

      // Show exact marker only within unlock radius
      if ((msg.distance_meters ?? Infinity) <= UNLOCK_RADIUS) {
        const typeColors: Record<string, string> = {
          classic: '#3b82f6',
          whisper: '#8b5cf6',
          mirage: '#f59e0b',
        };
        const color = typeColors[msg.ping_type] ?? '#3b82f6';
        const avatar = AVATARS[msg.avatar_id ?? 0] ?? '📍';

        const marker = new AMap.Marker({
          position: [msg.lng, msg.lat],
          content: `<div style="
            background:${color};color:white;
            border-radius:50%;width:36px;height:36px;
            display:flex;align-items:center;justify-content:center;
            font-size:18px;cursor:pointer;
            box-shadow:0 2px 8px rgba(0,0,0,0.4);
            border:2px solid white;">
            ${avatar}
          </div>`,
          offset: new AMap.Pixel(-18, -18),
        });

        marker.on('click', () => onOpenPing(msg));
        marker.setMap(map);
        markersRef.current.push(marker);
      }
    });

    heatmap.setDataSet({ data: heatData, max: 3 });
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ height: '380px', width: '100%', borderRadius: '12px' }} />
      <div style={{
        position: 'absolute', bottom: 10, left: 10,
        background: 'rgba(0,0,0,0.6)', color: 'white',
        borderRadius: '8px', padding: '6px 10px', fontSize: '12px',
      }}>
        热力图：500m内 · 标记：50m内可开启
      </div>
    </div>
  );
}
