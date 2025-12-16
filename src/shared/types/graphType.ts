export type GraphNode = {
  id: string;
  personId?: string; // 그룹/태그 노드는 personId가 없음
  name: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  nodeType?: 'person' | 'group' | 'tag'; // 노드 타입 구분
};

export type GraphLink = {
  id: string;
  source: GraphNode;
  target: GraphNode;
  type: string;
  strength: number;
};

