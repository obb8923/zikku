export const NODE_RADIUS = 4;

// GraphScreen 에서 사용하는 상수들
export const RENDER_THROTTLE_FACTOR = 2; // tick당 2번에 1번 렌더 (성능 최적화)
export const TAP_THRESHOLD = 10; // 터치 임계값
export const TAP_TIME_THRESHOLD = 200; // 터치 시간 임계값
export const EDGE_TOUCH_WIDTH = 20; // 엣지 터치 너비
export const DIMMED_OPACITY = 0.2; // 어두운 효과 투명도
export const NODE_HIT_RADIUS = NODE_RADIUS * 4; // 노드 터치 반지름 (드래그 편의성을 위해 넓게 설정)

// 캔버스 경계 padding (노드가 이동할 수 있는 영역의 여백)
export const CANVAS_PADDING = 40; // 캔버스 가장자리로부터의 여백
