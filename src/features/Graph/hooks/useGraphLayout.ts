import { useEffect, useRef } from 'react';
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  Simulation,
  forceX,
  forceY,
  forceCenter,
} from 'd3-force';
import { useSharedValue } from 'react-native-reanimated';
import { GraphNode, GraphLink } from '@/shared/types/graphType';

export function useGraphLayout(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
): {
  tickSignal: { value: number };
  simulationRef: React.MutableRefObject<Simulation<GraphNode, GraphLink> | null>;
  fixNode: (nodeId: string) => void;
  unfixNode: (nodeId: string) => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => void;
  updateNodePositionDirect: (nodeId: string, x: number, y: number) => void;
} {
  const tickSignal = useSharedValue(0);
  const simulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const nodesRef = useRef<GraphNode[]>(nodes);

  // 최신 nodes를 ref에 저장
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    if (!width || !height) return;

    // 기존 simulation이 있으면 완전히 정리
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }

    const centerX = width / 2;
    const centerY = height / 2;

    // links 깊은 복사 - d3-force가 원본을 수정하지 않도록
    // source/target을 현재 nodes 배열의 노드로 재연결
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const linksCopy = links.map(link => ({
      ...link,
      source: nodeMap.get(link.source.id) || link.source,
      target: nodeMap.get(link.target.id) || link.target,
    }));

    const sim: Simulation<GraphNode, GraphLink> = forceSimulation(nodes)
      .force(
        'charge',
        forceManyBody().strength(-100) // 반발력 강화 (더 음수 = 더 멀리 밀어냄)
      )
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(linksCopy)
          .id((d) => d.id)
          .distance(100) // 링크 목표 거리 증가 (노드 간 거리 증가)
          .strength(0.3) // 링크 강도
      )
      .force('x', forceX(centerX).strength(0.05)) // 중앙으로 모이는 힘 약하게
      .force('y', forceY(centerY).strength(0.05)) // 중앙으로 모이는 힘 약하게
      .on('tick', () => {
        // d3-force가 노드 객체를 직접 수정하므로 tickSignal을 업데이트하여 리렌더링 트리거
        tickSignal.value = tickSignal.value + 1;
      });

    simulationRef.current = sim;

    return () => {
      sim.stop();
      simulationRef.current = null;
    };
  }, [nodes, links, tickSignal, width, height]);

  const fixNode = (nodeId: string) => {
    if (simulationRef.current) {
      // 시뮬레이션의 노드 배열에서 찾기 (d3-force가 직접 수정하는 노드 객체)
      const simNodes = simulationRef.current.nodes();
      const node = simNodes.find((n) => n.id === nodeId);
      if (node) {
        // 드래그 시작 시 노드 위치 고정
        // dragstarted 함수: event.subject.fx = event.subject.x
        node.fx = node.x;
        node.fy = node.y;
        // 드래그 시작 시 alphaTarget을 설정하여 시뮬레이션을 활성화
        // if (!event.active) simulation.alphaTarget(0.3).restart()
        simulationRef.current.alphaTarget(0.3).restart();
      }
    }
  };

  const unfixNode = (nodeId: string) => {
    if (simulationRef.current) {
      // 시뮬레이션의 노드 배열에서 찾기 (d3-force가 직접 수정하는 노드 객체)
      const simNodes = simulationRef.current.nodes();
      const node = simNodes.find((n) => n.id === nodeId);
      if (node) {
        // 드래그 종료 시 노드 고정 해제 및 alphaTarget 초기화
        node.fx = null;
        node.fy = null;
        // 드래그 종료 시 alphaTarget을 0으로 설정하여 시뮬레이션이 자연스럽게 종료되도록 함
        simulationRef.current.alphaTarget(0);
      }
    }
  };

  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    if (simulationRef.current) {
      const simNodes = simulationRef.current.nodes();
      const node = simNodes.find((n) => n.id === nodeId);
      if (node) {
        // 노드 위치 업데이트 및 고정
        node.x = x;
        node.y = y;
        node.fx = x;
        node.fy = y;
        // 시뮬레이션 재시작하여 다른 노드들이 반응하도록 함
        simulationRef.current.alpha(1).restart();
      }
    }
  };

  // 드래그 중에만 위치 업데이트 (dragged 함수)
  const updateNodePositionDirect = (nodeId: string, x: number, y: number) => {
    if (simulationRef.current) {
      const simNodes = simulationRef.current.nodes();
      const node = simNodes.find((n) => n.id === nodeId);
      if (node) {
        // 드래그 중에는 fx, fy만 업데이트
        node.fx = x;
        node.fy = y;
      }
    }
  };

  return { tickSignal, simulationRef, fixNode, unfixNode, updateNodePosition, updateNodePositionDirect };
}

