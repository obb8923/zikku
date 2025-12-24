import { CHIP_TYPE } from '@constants/CHIP';

// 카테고리별 마커 이미지 매핑 (한 번만 로드)
export const MARKER_IMAGES = {
  [CHIP_TYPE.LANDSCAPE]: require('@assets/pngs/blue.png'),
  [CHIP_TYPE.PLACE]: require('@assets/pngs/purple.png'),
  [CHIP_TYPE.LIFE]: require('@assets/pngs/red.png'),
  [CHIP_TYPE.DISCOVERY]: require('@assets/pngs/orange.png'),
  [CHIP_TYPE.TOGETHER]: require('@assets/pngs/green.png'),
} as const;

// 기본 마커 이미지
export const DEFAULT_MARKER_IMAGE = require('@assets/pngs/blue.png');

// 카테고리별 마커 이미지 가져오기 함수
export const getMarkerImage = (category: string | null | undefined) => {
  if (!category) {
    return DEFAULT_MARKER_IMAGE;
  }
  return MARKER_IMAGES[category as keyof typeof MARKER_IMAGES] ?? DEFAULT_MARKER_IMAGE;
};

// 줌 레벨에 따른 Polyline 두께 계산 상수
export const POLYLINE_STROKE_CONFIG = {
  // 최소 두께 (확대된 상태)
  MIN_WIDTH: 6,
  // 최대 두께 (축소된 상태)
  MAX_WIDTH: 15,
  // 최소 latitudeDelta (확대된 상태)
  MIN_DELTA: 0.01,
  // 최대 latitudeDelta (축소된 상태)
  MAX_DELTA: 10,
  // 기본 두께 (region이 없을 때)
  DEFAULT_WIDTH: 3,
  // 선의 색상
  COLOR: 'rgba(59, 130, 246, 0.6)', // 파란색, 60% 투명 (겹칠 때 더 진해지도록 낮은 알파값 사용)
} as const;

// 줌 레벨에 따른 마커 크기 계산 상수
export const MARKER_SIZE_CONFIG = {
  // 최소 크기 (축소된 상태)
  MIN_SIZE: 0,
  // 최대 크기 (확대된 상태)
  MAX_SIZE: 24,
  // 최소 latitudeDelta (확대된 상태)
  MIN_DELTA: 0,
  // 최대 latitudeDelta (축소된 상태)
  MAX_DELTA: 10,
  // 기본 크기 (region이 없을 때)
  DEFAULT_SIZE: 24,
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
  // 처음 화면일 때의 줌 레벨 (작게, 넓은 영역 보기)
  INITIAL: 10,
  // 시작하기 버튼을 눌렀을 때의 줌 레벨 (확대)
  STARTED: 14,
} as const;

