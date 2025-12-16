import { StyleSheet, Platform, View } from 'react-native';
import { useMemo } from 'react';
import {
  Canvas,
  Skia,
  useFonts,
  matchFont,
  Picture,
  createPicture,
  Group,
} from '@shopify/react-native-skia';
import { GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue } from 'react-native-reanimated';
import type { ComponentProps } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import type { GraphLink, GraphNode } from '@/shared/types/graphType';
import {
  DIMMED_OPACITY,
  NODE_RADIUS,
} from '@features/Graph/constants';
import { useColors } from '@shared/hooks/useColors';
import {
  DEPTH_COLORS,
  EDGE_COLOR_HIGHLIGHT,
  EDGE_COLOR_NORMAL,
  NODE_COLOR_GROUP,
  NODE_COLOR_TAG,
  NODE_COLOR_PERSON,
  NODE_TEXT_COLOR,
} from '@shared/constants/COLORS';

type GestureType = ComponentProps<typeof GestureDetector>['gesture'];

interface GraphCanvasProps {
  renderNodes: GraphNode[];
  renderLinks: GraphLink[];
  connectedNodeIds: Set<string>;
  connectedLinkIds: Set<string>;
  nodeDepths?: Map<string, number>;
  isSelectionActive: boolean;
  panGesture: GestureType;
  renderTick?: number; // D3 시뮬레이션 업데이트를 위한 강제 재렌더링 트리거
  scale?: SharedValue<number>;
  translateX?: SharedValue<number>;
  translateY?: SharedValue<number>;
}

const getDepthColor = (depth?: number) => {
  if (depth === undefined) return null;
  // 기준 노드(0촌)는 색 적용하지 않음
  if (depth <= 0) return null;
  const normalizedIndex = depth - 1;
  const clampedIndex = Math.min(normalizedIndex, DEPTH_COLORS.length - 1);
  return DEPTH_COLORS[clampedIndex];
};

// Paint 객체를 미리 생성하여 재사용 (GC 부담 감소)
const edgePaint = Skia.Paint();
edgePaint.setStyle(1); // Stroke
edgePaint.setStrokeWidth(0.3); // 엣지 굵기 감소

const nodePaint = Skia.Paint();
const textPaint = Skia.Paint();

export const GraphCanvas = ({
  renderNodes,
  renderLinks,
  connectedNodeIds,
  connectedLinkIds,
  nodeDepths = new Map<string, number>(),
  isSelectionActive,
  panGesture,
  renderTick = 0,
  scale,
  translateX,
  translateY,
}: GraphCanvasProps) => {
  const colors = useColors();

  // Transform matrix 계산
  // translate 후 scale 순서로 적용하여 anchor 보정이 올바르게 작동하도록 함
  // 이 순서는 anchor 점을 기준으로 zoom할 때 자연스러운 동작을 보장함
  const matrix = useDerivedValue(() => {
    const m = Skia.Matrix();
    const currentScale = scale?.value ?? 1;
    const currentTranslateX = translateX?.value ?? 0;
    const currentTranslateY = translateY?.value ?? 0;
    
    // translate를 먼저 적용한 후 scale을 적용
    // 이렇게 하면 anchor 보정 계산이 올바르게 작동함
    m.translate(currentTranslateX, currentTranslateY);
    m.scale(currentScale, currentScale);
    
    return m;
  }, [scale, translateX, translateY]);

  // 폰트를 한 번만 로드하여 모든 노드에서 공유 (성능 최적화)
  const fontMgr = useFonts({
    'NotoSansKR-SemiBold': [
      require('../../../../assets/fonts/NotoSansKR-SemiBold.ttf')
    ]
  });

  // 폰트 매칭을 한 번만 수행 (useMemo로 최적화)
  const font = useMemo(() => {
    if (!fontMgr) return null;
    const fontStyle = {
      fontFamily: 'NotoSansKR-SemiBold',
      fontSize: 10
    } as const;
    return matchFont(fontStyle, fontMgr);
  }, [fontMgr]);

  // 노드 맵 생성 - 렌더링될 노드 위치 조회용 (메모이제이션)
  const nodeMap = useMemo(() => {
    return new Map(renderNodes.map(n => [n.id, n]));
  }, [renderNodes]);

  // Picture를 매 프레임마다 재생성하여 최신 위치로 그리기
  // D3 시뮬레이션과 호환되도록 renderNodes, renderLinks가 변경될 때마다 재생성
  const picture = useMemo(() => {
    if (!fontMgr || !font) return null;

    return createPicture((canvas) => {
      // 캔버스 클리어
      canvas.clear(Skia.Color('transparent'));

      // === Edge 그리기 ===
      renderLinks.forEach((link) => {
        const sn = nodeMap.get(link.source.id);
        const tn = nodeMap.get(link.target.id);

        if (!sn || !tn) return;

        const isHighlighted = connectedLinkIds.has(link.id);
        const opacity = isSelectionActive
          ? (connectedLinkIds.has(link.id) ? 1 : DIMMED_OPACITY)
          : 1;

        // 색상 결정 (하이라이트 시 EDGE_COLOR_HIGHLIGHT, 아니면 EDGE_COLOR_NORMAL)
        const strokeColor = isHighlighted
          ? colors[EDGE_COLOR_HIGHLIGHT]
          : colors[EDGE_COLOR_NORMAL];

        edgePaint.setColor(Skia.Color(strokeColor));
        edgePaint.setAlphaf(opacity);

        canvas.drawLine(sn.x, sn.y, tn.x, tn.y, edgePaint);
      });

      // === Node 그리기 ===
      renderNodes.forEach((node) => {
        const opacity = isSelectionActive
          ? (connectedNodeIds.has(node.id) ? 1 : DIMMED_OPACITY)
          : 1;

        // 노드 타입/촌수에 따라 색상과 크기 결정
        const depthColor = getDepthColor(nodeDepths.get(node.id));
        const nodeColor =
          depthColor ??
          (node.nodeType === 'group'
            ? colors[NODE_COLOR_GROUP]
            : node.nodeType === 'tag'
              ? colors[NODE_COLOR_TAG]
              : colors[NODE_COLOR_PERSON]);
        const nodeRadius =
          node.nodeType === 'group' || node.nodeType === 'tag'
            ? NODE_RADIUS * 1.2
            : NODE_RADIUS;

        // Circle 그리기
        nodePaint.setColor(Skia.Color(nodeColor));
        nodePaint.setAlphaf(opacity);
        canvas.drawCircle(node.x, node.y, nodeRadius, nodePaint);

        // Text 그리기
        if (font) {
          textPaint.setColor(Skia.Color(colors[NODE_TEXT_COLOR]));
          textPaint.setAlphaf(opacity);

          // 텍스트 중앙 정렬 계산
          const metrics = font.measureText(node.name);
          const textWidth = metrics.width;
          const centeredX = node.x - textWidth / 2;
          const textY = node.y + nodeRadius + 19;

          canvas.drawText(node.name, centeredX, textY, textPaint, font);
        }
      });
    });
  }, [
    fontMgr,
    font,
    renderNodes,
    renderLinks,
    nodeMap,
    connectedNodeIds,
    connectedLinkIds,
    isSelectionActive,
    nodeDepths,
    colors[EDGE_COLOR_HIGHLIGHT],
    colors[EDGE_COLOR_NORMAL],
    colors[NODE_COLOR_GROUP],
    colors[NODE_COLOR_TAG],
    colors[NODE_COLOR_PERSON],
    colors[NODE_TEXT_COLOR],
    renderTick, // D3 시뮬레이션 업데이트 시 Picture 재생성
  ]);

  if (Platform.OS === 'ios') {
    return (
      <>
        {/* 터치 전용 레이어 */}
        <GestureDetector gesture={panGesture}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]} />
        </GestureDetector>

        {/* 렌더링 전용 레이어 */}
        <Canvas style={[StyleSheet.absoluteFill]} pointerEvents="none">
          <Group matrix={matrix}>
            {picture && <Picture picture={picture} />}
          </Group>
        </Canvas>
      </>
    );
  }

  return (
    <>
      {/* 터치 전용 레이어 */}
      <GestureDetector gesture={panGesture}>
        {/* 렌더링 전용 레이어 */}
        <Canvas style={[StyleSheet.absoluteFill]} pointerEvents="none">
          <Group matrix={matrix}>
            {picture && <Picture picture={picture} />}
          </Group>
        </Canvas>
      </GestureDetector>
    </>
  );
};
