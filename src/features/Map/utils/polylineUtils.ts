import { Region } from 'react-native-maps';
import { POLYLINE_STROKE_CONFIG } from '../constants/MAP';

/**
 * 줌 레벨에 따른 Polyline 두께 계산
 * 지도를 축소하면 (latitudeDelta가 큼) 두께가 커지고, 확대하면 (latitudeDelta가 작음) 두께가 작아짐
 * 
 * @param region 현재 지도 영역 (Region)
 * @returns 계산된 선의 두께 (픽셀)
 */
export const getPolylineStrokeWidth = (region: Region | null): number => {
  if (!region) {
    return POLYLINE_STROKE_CONFIG.DEFAULT_WIDTH;
  }

  const latitudeDelta = region.latitudeDelta;
  
  // 범위 제한
  const clampedDelta = Math.max(
    POLYLINE_STROKE_CONFIG.MIN_DELTA,
    Math.min(POLYLINE_STROKE_CONFIG.MAX_DELTA, latitudeDelta)
  );
  
  // 선형 보간
  const ratio =
    (clampedDelta - POLYLINE_STROKE_CONFIG.MIN_DELTA) /
    (POLYLINE_STROKE_CONFIG.MAX_DELTA - POLYLINE_STROKE_CONFIG.MIN_DELTA);
  const strokeWidth =
    POLYLINE_STROKE_CONFIG.MIN_WIDTH +
    (POLYLINE_STROKE_CONFIG.MAX_WIDTH - POLYLINE_STROKE_CONFIG.MIN_WIDTH) * ratio;
  
  return Math.round(strokeWidth);
};

