import type { ColorKey } from '@shared/hooks/useColors';

// 촌수별 색상 (1촌부터 7촌까지)
export const DEPTH_COLORS = [
  '#ff4d4f', // 빨 - 1촌
  '#fa8c16', // 주 - 2촌
  '#fadb14', // 노 - 3촌
  '#52c41a', // 초 - 4촌
  '#1890ff', // 파 - 5촌
  '#2f54eb', // 남 - 6촌
  '#722ed1', // 보 - 7촌
];

// 엣지 색상 키
export const EDGE_COLOR_HIGHLIGHT: ColorKey = 'PRIMARY'; // 하이라이트된 엣지 색상
export const EDGE_COLOR_NORMAL: ColorKey = 'TEXT_2'; // 일반 엣지 색상

// 노드 색상 키
export const NODE_COLOR_GROUP: ColorKey = 'TEXT'; // 그룹 노드 색상
export const NODE_COLOR_TAG: ColorKey = 'TEXT'; // 태그 노드 색상
export const NODE_COLOR_PERSON: ColorKey = 'TEXT_2'; // 사람 노드 색상
export const NODE_TEXT_COLOR: ColorKey = 'TEXT'; // 노드 텍스트 색상
