import { useCallback } from 'react';
import { runOnJS, useSharedValue, type SharedValue } from 'react-native-reanimated';
import {
  Gesture,
  type GestureStateChangeEvent,
  type GestureUpdateEvent,
  type PanGestureHandlerEventPayload,
  type PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import type { Simulation } from 'd3-force';
import type { GraphNode, GraphLink } from '@/shared/types/graphType';
import {
  TAP_THRESHOLD,
  TAP_TIME_THRESHOLD,
  NODE_HIT_RADIUS,
} from '@features/Graph/constants';

interface UseGraphGestureProps {
  simulationRef: React.MutableRefObject<Simulation<GraphNode, GraphLink> | null>;
  convertToLocal: (absoluteX: number, absoluteY: number) => { x: number; y: number };
  fixNode: (nodeId: string) => void;
  unfixNode: (nodeId: string) => void;
  updateNodePositionDirect: (nodeId: string, x: number, y: number) => void;
  handleNodeSelect: (nodeId: string | null) => void;
  handleTap: (nodeId: string | null) => void;
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  focalX: SharedValue<number>;
  focalY: SharedValue<number>;
  setScale: (scale: number) => void;
  setTranslate: (x: number, y: number) => void;
  MIN_SCALE: number;
  MAX_SCALE: number;
  canvasOffsetX: SharedValue<number>;
  canvasOffsetY: SharedValue<number>;
}

export function useGraphGesture({
  simulationRef,
  convertToLocal,
  fixNode,
  unfixNode,
  updateNodePositionDirect,
  handleNodeSelect,
  handleTap,
  scale,
  translateX,
  translateY,
  focalX,
  focalY,
  setScale,
  setTranslate,
  MIN_SCALE,
  MAX_SCALE,
  canvasOffsetX,
  canvasOffsetY,
}: UseGraphGestureProps) {
  const touchStartX = useSharedValue(0);
  const touchStartY = useSharedValue(0);
  const touchStartTimestamp = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const draggedNodeId = useSharedValue<string | null>(null);
  const lastScale = useSharedValue(1);
  const lastTranslateX = useSharedValue(0);
  const lastTranslateY = useSharedValue(0);
  // 핀치 시작 시 초기 zoom 값을 저장 (절대값 계산을 위해)
  const pinchStartZoom = useSharedValue(1);
  const pinchStartTranslateX = useSharedValue(0);
  const pinchStartTranslateY = useSharedValue(0);
  const pinchStartFocalX = useSharedValue(0);
  const pinchStartFocalY = useSharedValue(0);

  // 터치 위치에서 가장 가까운 노드 찾기 (worklet)
  const findNodeAtPosition = (x: number, y: number, nodeList: GraphNode[]): string | null => {
    'worklet';
    for (let i = 0; i < nodeList.length; i++) {
      const node = nodeList[i];
      const distance = Math.sqrt(
        Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2)
      );
      if (distance <= NODE_HIT_RADIUS) {
        return node.id;
      }
    }
    return null;
  };

  // 시뮬레이션 노드 가져오기 (JS에서만 호출)
  const getSimNodes = () => simulationRef.current?.nodes() ?? [];

  const panGesture = Gesture.Pan()
    .activeOffsetX([-1, 1])
    .activeOffsetY([-1, 1])
    .minDistance(0)
    .runOnJS(true) // <-- Reanimated + JS 콜 많이 쓰면 넣어주는게 안전함
    .shouldCancelWhenOutside(false) // 뷰 밖으로 나가도 cancel 안 되게
    .onStart((e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
      'worklet';
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
      
      const { x: localX, y: localY } = convertToLocal(
        e.absoluteX,
        e.absoluteY,
      );
      touchStartX.value = localX;
      touchStartY.value = localY;
      touchStartTimestamp.value = Date.now();
      isDragging.value = false;
      draggedNodeId.value = null;

      const currentNodes = getSimNodes();
      if (!currentNodes || currentNodes.length === 0) {
        runOnJS(handleNodeSelect)(null);
        return;
      }

      const nodeId = findNodeAtPosition(localX, localY, currentNodes);
      if (nodeId) {
        draggedNodeId.value = nodeId;
        runOnJS(fixNode)(nodeId);
        runOnJS(handleNodeSelect)(nodeId);
      } else {
        runOnJS(handleNodeSelect)(null);
      }
    })
    .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      'worklet';
      const { x: localX, y: localY } = convertToLocal(
        e.absoluteX,
        e.absoluteY,
      );
      const distance = Math.sqrt(
        Math.pow(localX - touchStartX.value, 2) +
        Math.pow(localY - touchStartY.value, 2)
      );

      if (distance > TAP_THRESHOLD && !isDragging.value) {
        isDragging.value = true;
      }

      if (draggedNodeId.value) {
        // 드래그 중에는 위치만 직접 업데이트 (시뮬레이션 재시작 안 함)
        runOnJS(updateNodePositionDirect)(draggedNodeId.value, localX, localY);
      } else {
        // 노드를 드래그하지 않을 때는 캔버스 전체를 이동
        const deltaX = e.translationX;
        const deltaY = e.translationY;
        setTranslate(
          lastTranslateX.value + deltaX,
          lastTranslateY.value + deltaY
        );
      }
    })
    .onFinalize(
      (e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        const { x: localX, y: localY } = convertToLocal(
          e.absoluteX,
          e.absoluteY,
        );

        const distance = Math.sqrt(
          Math.pow(localX - touchStartX.value, 2) +
          Math.pow(localY - touchStartY.value, 2)
        );
        const timeElapsed = Date.now() - touchStartTimestamp.value;

        if (draggedNodeId.value) {
          // 드래그 종료 시 노드 고정 해제 및 시뮬레이션 재시작
          runOnJS(unfixNode)(draggedNodeId.value);
        } else {
          // 캔버스 이동 종료 시 마지막 위치 저장
          lastTranslateX.value = translateX.value;
          lastTranslateY.value = translateY.value;
        }

        // 탭 판정 (runOnJS 호출 최소화)
        let tapNodeId: string | null = null;
        if (!isDragging.value && distance < TAP_THRESHOLD && timeElapsed < TAP_TIME_THRESHOLD) {
          const currentNodes = getSimNodes();

          if (currentNodes && currentNodes.length > 0) {
            tapNodeId = findNodeAtPosition(localX, localY, currentNodes);
          }
        }

        isDragging.value = false;
        draggedNodeId.value = null;
        
        // 탭 처리와 선택 해제를 하나의 JS 호출로 통합
        if (tapNodeId) {
          runOnJS(handleTap)(tapNodeId);
        }
        runOnJS(handleNodeSelect)(null);
      },
    );

  const pinchGesture = Gesture.Pinch()
    .onStart((e: GestureStateChangeEvent<PinchGestureHandlerEventPayload>) => {
      'worklet';
      // 핀치 시작 시 현재 zoom과 translate 값을 별도로 저장 (절대값 계산을 위해)
      pinchStartZoom.value = scale.value;
      pinchStartTranslateX.value = translateX.value;
      pinchStartTranslateY.value = translateY.value;
      
      // 핀치 시작 시 중심점을 캔버스 컨테이너의 로컬 좌표로 변환하여 저장
      pinchStartFocalX.value = e.focalX - canvasOffsetX.value;
      pinchStartFocalY.value = e.focalY - canvasOffsetY.value;
      
      // 기존 lastScale, lastTranslate도 업데이트 (다른 제스처와의 호환성)
      lastScale.value = scale.value;
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
    })
    .onUpdate((e: GestureUpdateEvent<PinchGestureHandlerEventPayload>) => {
      'worklet';
      // 절대값 계산: 핀치 시작 시 zoom 값에 제스처의 scale을 곱함
      // e.scale이 1로 리셋되거나 튀어도 zoom 자체는 흔들리지 않음
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchStartZoom.value * e.scale));

      // 핀치 시작 시 저장된 중심점을 그래프 좌표계로 변환
      // translate 후 scale 순서이므로: 그래프 좌표 = (컨테이너 좌표 - translate) / scale
      const focalXGraph = (pinchStartFocalX.value - pinchStartTranslateX.value) / pinchStartZoom.value;
      const focalYGraph = (pinchStartFocalY.value - pinchStartTranslateY.value) / pinchStartZoom.value;
      
      // 새로운 스케일에서의 translate 계산
      // 핀치 시작 시점의 중심점이 화면상 같은 위치에 유지되도록 보정
      // translate 후 scale 순서이므로: 컨테이너 좌표 = translate + (그래프 좌표 * scale)
      // 따라서: translate = 시작 중심점 컨테이너 좌표 - (그래프 좌표 * 새 scale)
      const newTranslateX = pinchStartFocalX.value - focalXGraph * newScale;
      const newTranslateY = pinchStartFocalY.value - focalYGraph * newScale;
      
      // scale과 translate를 동시에 업데이트하여 깜빡임 방지
      setScale(newScale);
      setTranslate(newTranslateX, newTranslateY);
    })
    .onEnd(() => {
      'worklet';
      // 핀치 종료 시 현재 값을 저장 (다음 핀치 시작 시 참조)
      lastScale.value = scale.value;
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  return composedGesture;
}

