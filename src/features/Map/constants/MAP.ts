/**
 * Map 관련 상수
 */

// 줌 레벨에 따른 Polyline 두께 계산 상수
export const POLYLINE_STROKE_CONFIG = {
  // 최소 두께 (확대된 상태)
  MIN_WIDTH: 2,
  // 최대 두께 (축소된 상태)
  MAX_WIDTH: 30,
  // 최소 latitudeDelta (확대된 상태)
  MIN_DELTA: 0.01,
  // 최대 latitudeDelta (축소된 상태)
  MAX_DELTA: 0.5,
  // 기본 두께 (region이 없을 때)
  DEFAULT_WIDTH: 3,
  // 선의 색상
  COLOR: '#3B82F6', // 파란색
} as const;

// 초기 지도 영역
export const INITIAL_MAP_REGION = {
  latitude: 37.5665,
  longitude: 126.9780,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
} as const;

// 줌 레벨 제한
export const ZOOM_LEVEL = {
  MIN: 5,
  MAX: 19,
  DEFAULT: 13,
} as const;

