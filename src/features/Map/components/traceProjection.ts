import type { Region } from 'react-native-maps';

export interface ScreenPoint {
  x: number;
  y: number;
}

// 매우 단순화된 Mercator 기반 투영 (현재 뷰포트 기준 상대 좌표)
export const latLngToScreenPoint = (
  latitude: number,
  longitude: number,
  region: Region,
  width: number,
  height: number,
): ScreenPoint => {
  const lngDelta = region.longitudeDelta || 0.0001;
  const latDelta = region.latitudeDelta || 0.0001;

  const x = ((longitude - region.longitude) / lngDelta + 0.5) * width;
  const y = ((region.latitude - latitude) / latDelta + 0.5) * height;

  return { x, y };
};


