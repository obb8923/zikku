import { Region } from 'react-native-maps';
import { MARKER_SIZE_CONFIG } from '../constants/MAP';

/**
 * zoom 레벨을 delta로 변환하는 유틸리티 함수
 * @param zoom 줌 레벨
 * @returns latitudeDelta와 longitudeDelta
 */
export const zoomToDelta = (zoom: number): { latitudeDelta: number; longitudeDelta: number } => {
  const latitudeDelta = 360 / Math.pow(2, zoom);
  const longitudeDelta = latitudeDelta; 
  return { latitudeDelta, longitudeDelta };
};

/**
 * delta를 zoom 레벨로 변환하는 유틸리티 함수
 * @param latitudeDelta 위도 델타
 * @returns 줌 레벨
 */
export const deltaToZoom = (latitudeDelta: number): number => {
  return Math.log2(360 / latitudeDelta);
};

/**
 * 줌 레벨에 따른 마커 크기 계산
 * - 지도를 확대하면 (보이는 영역이 좁아짐, latitudeDelta가 작음) → 마커가 커짐 (MAX_SIZE)
 * - 지도를 축소하면 (보이는 영역이 넓어짐, latitudeDelta가 큼) → 마커가 작아짐 (MIN_SIZE)
 * 
 * @param region 현재 지도 영역 (Region)
 * @returns 계산된 마커 크기
 */
export const getMarkerSize = (region: Region | null): number => {
  if (!region) {
    return MARKER_SIZE_CONFIG.DEFAULT_SIZE;
  }

  const latitudeDelta = region.latitudeDelta;
  
  // 범위 제한
  const clampedDelta = Math.max(
    MARKER_SIZE_CONFIG.MIN_DELTA,
    Math.min(MARKER_SIZE_CONFIG.MAX_DELTA, latitudeDelta)
  );
  
  // 선형 보간
  // latitudeDelta가 작을수록 (확대) ratio가 0에 가까워지고, size는 MAX_SIZE에 가까워짐
  // latitudeDelta가 클수록 (축소) ratio가 1에 가까워지고, size는 MIN_SIZE에 가까워짐
  const ratio =
    (clampedDelta - MARKER_SIZE_CONFIG.MIN_DELTA) /
    (MARKER_SIZE_CONFIG.MAX_DELTA - MARKER_SIZE_CONFIG.MIN_DELTA);
  const size =
    MARKER_SIZE_CONFIG.MAX_SIZE -
    (MARKER_SIZE_CONFIG.MAX_SIZE - MARKER_SIZE_CONFIG.MIN_SIZE) * ratio;
  
  return Math.round(size);
};



