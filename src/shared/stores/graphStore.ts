import { create } from 'zustand';
import { GraphNode, GraphLink } from '@/shared/types/graphType';
import { Relation } from '@/shared/types/relationType';

interface GraphStore {
  nodes: GraphNode[];
  links: GraphLink[];
  addNode: (node: GraphNode) => void;
  addLink: (link: GraphLink) => void;
  setNodes: (nodes: GraphNode[]) => void;
  setLinks: (links: GraphLink[]) => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => void;
}

/**
 * 노드 배열과 관계 정보를 받아 엣지를 생성합니다.
 * 항상 최신 노드 배열에서 source/target을 참조하여 엣지를 생성합니다.
 * @param nodes - 현재 노드 배열
 * @param relations - 관계 정보 배열
 * @returns 생성된 엣지 배열
 */
export function createLinksFromNodes(
  nodes: GraphNode[],
  relations: Relation[],
): GraphLink[] {
  // 노드 맵 생성 (빠른 조회를 위해)
  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach((node) => {
    if (node.personId) {
      nodeMap.set(node.personId, node);
    }
    // ID로도 조회 가능하도록 (필터링된 노드의 경우)
    nodeMap.set(node.id, node);
  });

  return relations
    .map((relation) => {
      const sourceNode = nodeMap.get(relation.sourcePersonId);
      const targetNode = nodeMap.get(relation.targetPersonId);

      if (!sourceNode || !targetNode) {
        return null;
      }

      return {
        id: relation.id,
        source: sourceNode,
        target: targetNode,
        type: relation.description,
        strength: relation.strength as number,
      };
    })
    .filter((link): link is GraphLink => link !== null);
}

/**
 * 두 노드 간에 엣지를 생성합니다.
 * @param sourceNode - 소스 노드
 * @param targetNode - 타겟 노드
 * @param linkId - 엣지 ID
 * @param type - 엣지 타입
 * @param strength - 엣지 강도
 * @returns 생성된 엣지
 */
export function createLinkBetweenNodes(
  sourceNode: GraphNode,
  targetNode: GraphNode,
  linkId: string,
  type: string,
  strength: number,
): GraphLink {
  return {
    id: linkId,
    source: sourceNode,
    target: targetNode,
    type,
    strength,
  };
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  links: [],
  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
  addLink: (link) => set((s) => ({ links: [...s.links, link] })),
  setNodes: (nodes) => set({ nodes }),
  setLinks: (links) => set({ links }),
  updateNodePosition: (nodeId, x, y) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, x, y, vx: 0, vy: 0 } : n
      ),
    })),
}));

