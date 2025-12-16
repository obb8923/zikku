import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useWindowDimensions, View, Alert, AppState, AppStateStatus, TouchableOpacity, Platform, Image } from 'react-native';
import { runOnJS, useDerivedValue } from 'react-native-reanimated';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Background, TabBar, ScreenHeader } from '@components/index';
import type { GraphStackParamList } from '@nav/stack/GraphStack';
import { useGraphStore } from '@stores/graphStore';
import { usePersonStore } from '@stores/personStore';
import { useGraphLayout } from '@features/Graph/hooks/useGraphLayout';
import {
  FilterDropdown,
  type FilterValue,
} from '@features/Graph/components/FilterDropdown';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '@constants/TAB_NAV_OPTIONS';
import { RENDER_THROTTLE_FACTOR } from '@features/Graph/constants';
import { useTranslation } from 'react-i18next';
import { AdmobNative } from '@components/ads/AdmobNative';
import { useGraphFilter } from '@features/Graph/hooks/useGraphFilter';
import { useNodeSelection } from '@features/Graph/hooks/useNodeSelection';
import { useCanvasOffset } from '@features/Graph/hooks/useCanvasOffset';
import { useGraphGesture } from '@features/Graph/hooks/useGraphGesture';
import { useGraphZoom } from '@features/Graph/hooks/useGraphZoom';
import { EmptyGraphView } from '@features/Graph/components/EmptyGraphView';
import { GraphCanvas } from '@features/Graph/components/GraphCanvas';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import ShareIcon from '@assets/svgs/Share.svg';
import KinshipIcon from '@assets/svgs/Kinship.svg';
import FilterIcon from '@assets/svgs/Filter.svg';
import { useColors } from '@shared/hooks/useColors';
import { Text } from '@components/Text';
import { useSubscriptionStore } from '@stores/subscriptionStore';
import { logEvent } from '@services/analytics';

type GraphScreenNavigationProp = NativeStackNavigationProp<GraphStackParamList, 'Graph'>;

export const GraphScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<GraphScreenNavigationProp>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const people = usePersonStore((s) => s.people);
  const nodes = useGraphStore((s) => s.nodes);
  const links = useGraphStore((s) => s.links);
  const isSubscribed = useSubscriptionStore((s) => s.subscriptionInfo.isSubscribed);
  const [selectedFilter, setSelectedFilter] = useState<FilterValue>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // 기본값을 OFF로 두어 그래프 복귀 시 자동 활성화되지 않도록 처리
  const [showKinshipColors, setShowKinshipColors] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [mountKey, setMountKey] = useState(0);
  const canvasWidth = (width - insets.left - insets.right);
  const canvasHeight = (height - insets.top - insets.bottom - 56 - TAB_BAR_HEIGHT - 32);
  const [renderTick, setRenderTick] = useState(0);

  const isMounted = useRef(false);
  const forceRender = useCallback(() => {
    if (!isMounted.current) return;
    if (__DEV__) {
      console.log('[Graph] forceRender');
    }
    setRenderTick((prev) => prev + 1);
  }, []);

  // 필터링 로직
  const { groups, tags, renderNodes, renderLinks } = useGraphFilter(
    nodes,
    links,
    selectedFilter,
    canvasWidth,
    canvasHeight,
  );

  // 레이아웃 시뮬레이션
  const { tickSignal, simulationRef, fixNode, unfixNode, updateNodePositionDirect } =
    useGraphLayout(renderNodes, renderLinks, canvasWidth, canvasHeight);

  // 확대/축소 관리
  const {
    scale,
    translateX,
    translateY,
    focalX,
    focalY,
    setScale,
    setTranslate,
    resetZoom,
    MIN_SCALE,
    MAX_SCALE,
  } = useGraphZoom();

  // Canvas 오프셋 관리
  const { canvasContainerRef, updateCanvasOffset, convertToLocal, canvasOffsetX, canvasOffsetY } = useCanvasOffset({
    scale,
    translateX,
    translateY,
  });
  const captureViewRef = useRef<View>(null);
  const appBrandingRef = useRef<View>(null);
  const colors = useColors();

  // 노드 선택 관리
  const { connectedLinkIds, connectedNodeIds, isSelectionActive } = useNodeSelection(
    selectedNodeId,
    renderLinks,
  );

  const kinshipOriginId = useMemo(() => {
    // "나" 기준: 첫 번째 사람(기본 생성된 본인) 우선, 선택한 노드가 있으면 그 노드를 기준으로
    if (selectedNodeId) return selectedNodeId;
    const myPersonId = people[0]?.id;
    return myPersonId ?? null;
  }, [selectedNodeId, people]);

  // 선택 노드를 기준으로 촌수(depth) 계산
  const nodeDepths = useMemo(() => {
    if (!showKinshipColors) return new Map<string, number>();
    if (!kinshipOriginId) return new Map<string, number>();

    const adjacency = new Map<string, string[]>();
    renderLinks.forEach((link) => {
      const sourceId = link.source.id;
      const targetId = link.target.id;
      if (!adjacency.has(sourceId)) adjacency.set(sourceId, []);
      if (!adjacency.has(targetId)) adjacency.set(targetId, []);
      adjacency.get(sourceId)!.push(targetId);
      adjacency.get(targetId)!.push(sourceId);
    });

    const depths = new Map<string, number>();
    const queue: string[] = [];

    depths.set(kinshipOriginId, 0);
    queue.push(kinshipOriginId);

    while (queue.length > 0) {
      const currentId = queue.shift() as string;
      const currentDepth = depths.get(currentId) ?? 0;
      const neighbors = adjacency.get(currentId) ?? [];

      const nextDepth = currentDepth + 1;
      neighbors.forEach((neighborId) => {
        if (!depths.has(neighborId)) {
          depths.set(neighborId, nextDepth);
          queue.push(neighborId);
        }
      });
    }

    return depths;
  }, [kinshipOriginId, renderLinks, showKinshipColors]);

  const lockedTitle = t('subscription.lockedFeatureTitle', '구독 필요');
  const lockedMessage = t('subscription.lockedFeatureMessage', '구독 시 사용 가능한 기능입니다.');
  const subscribeCta = t('subscriptionScreen.actions.subscribe', '구독하기');
  const cancelCta = t('common.cancel', '닫기');

  const goToSubscription = useCallback(() => {
    navigation.navigate('Subscription');
  }, [navigation]);

  const showLockedAlert = useCallback(() => {
    Alert.alert(lockedTitle, lockedMessage, [
      { text: cancelCta, style: 'cancel' },
      { text: subscribeCta, onPress: goToSubscription },
    ]);
  }, [lockedMessage, lockedTitle, subscribeCta, cancelCta, goToSubscription]);

  const toggleKinshipColors = useCallback(() => {
    if (!isSubscribed) {
      showLockedAlert();
      return;
    }
    setShowKinshipColors((prev) => {
      const next = !prev;
      logEvent('graph_kinship_toggle', { enabled: next });
      return next;
    });
  }, [isSubscribed, showLockedAlert]);

  // 촌수 보기 ON일 때는 클릭 시 반투명 처리를 비활성화
  const effectiveSelectionActive = showKinshipColors ? false : isSelectionActive;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 앱 상태 변경 감지 (백그라운드 <-> 포그라운드)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // 백그라운드에서 포그라운드로 돌아올 때 완전히 재마운트
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // mountKey를 변경하여 컴포넌트를 완전히 재마운트
        setMountKey((prev) => prev + 1);
        setSelectedFilter(null);
        setSelectedNodeId(null);
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  useDerivedValue(() => {
    // tickSignal.value 접근을 통해 시뮬레이션 틱마다 React 리렌더 트리거
    const value = tickSignal?.value;
    if (value === undefined) {
      return;
    }

    // RENDER_THROTTLE_FACTOR 배수일 때만 React 리렌더 실행
    if (value % RENDER_THROTTLE_FACTOR === 0) {
      runOnJS(forceRender)();
    }
  }, [tickSignal, forceRender, RENDER_THROTTLE_FACTOR]);

  const handleNodePress = useCallback((nodeId: string) => {
    // renderNodes에서 노드 찾기 (필터링된 노드 중에서)
    const node = renderNodes.find((n) => n.id === nodeId);
    
    // person 타입 노드이고 personId가 있는 경우에만 PersonDetail로 이동
    if (node && node.nodeType === 'person' && node.personId) {
      navigation.navigate('PersonDetail', { personId: node.personId });
    }
  }, [renderNodes, navigation]);

  // 탭 처리 함수
  const handleTap = useCallback((nodeId: string | null) => {
    if (nodeId) {
      handleNodePress(nodeId);
    }
  }, [handleNodePress]);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    logEvent('graph_node_select', { node_id: nodeId || undefined });
  }, []);

  // 그래프 캡처 및 공유 함수
  const handleCaptureGraph = useCallback(async () => {
    if (!captureViewRef.current || (renderNodes.length === 0 && renderLinks.length === 0)) {
      return;
    }

    try {
      // 앱 아이콘과 이름을 보이게 설정
      if (appBrandingRef.current) {
        appBrandingRef.current.setNativeProps({ opacity: 1 });
      }

      // View를 이미지로 캡처
      const uri = await captureRef(captureViewRef.current, {
        format: 'png',
        quality: 1.0,
      });

      // 캡처 후 다시 숨김
      if (appBrandingRef.current) {
        appBrandingRef.current.setNativeProps({ opacity: 0 });
      }

      // 앱 스토어 링크 생성
      const appStoreLink = Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/id6739202000' // iOS 앱 스토어 링크 (실제 앱 ID로 교체 필요)
        : 'https://play.google.com/store/apps/details?id=com.jeong.linknote'; // Android 플레이 스토어 링크

      // 이미지와 앱 링크 함께 공유
      await Share.open({
        url: uri,
        type: 'image/png',
        message: `${t('graph.capture.shareMessage')}\n\n${t('graph.capture.appLink')}\n${appStoreLink}`,
      });
      logEvent('graph_share', { node_count: renderNodes.length, link_count: renderLinks.length });
    } catch (error: any) {
      // 사용자가 공유를 취소한 경우는 에러로 처리하지 않음
      if (error.message !== 'User did not share') {
        console.error('Share error:', error);
        Alert.alert(
          t('graph.capture.error'),
          t('graph.capture.errorMessage'),
        );
      }
    }
  }, [renderNodes.length, renderLinks.length, t]);

  // 제스처 처리
  const panGesture = useGraphGesture({
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
  });

  // 포커스를 잃으면 언마운트
  if (!isFocused) {
    return null;
  }

  return (
    <Background isTabBarGap={true}>
      <ScreenHeader
        title={t('graph.title')}
        rightContent={
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={toggleKinshipColors}
              className="p-2"
              activeOpacity={0.7}
            >
              <KinshipIcon
                width={18}
                height={18}
                color={showKinshipColors ? colors.PRIMARY : colors.TEXT}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCaptureGraph}
              className="p-2"
              activeOpacity={0.7}
              disabled={renderNodes.length === 0 && renderLinks.length === 0}
            >
              <ShareIcon
                width={18}
                height={18}
                color={colors.TEXT}
              />
            </TouchableOpacity>
            {isSubscribed ? (
              <FilterDropdown
                groups={groups}
                tags={tags}
                selectedFilter={selectedFilter}
                onSelectFilter={(filter) => {
                  setSelectedFilter(filter);
                  logEvent('graph_filter_change', {
                    type: filter?.type ?? null,
                    value: filter?.value ?? null,
                  });
                }}
              />
            ) : (
              <TouchableOpacity
                onPress={showLockedAlert}
                className="p-2"
                activeOpacity={0.7}
              >
                <FilterIcon width={18} height={18} color={colors.TEXT} />
              </TouchableOpacity>
            )}
          </View>
        }
      />
      <View className="flex-1 justify-center items-center overflow-visible">
        {(renderNodes.length === 0 && renderLinks.length === 0) ? (
          <EmptyGraphView />
        ) : (
          <View
            ref={captureViewRef}
            collapsable={false}
            className="bg-background"
            style={{ width: canvasWidth, height: canvasHeight }}
          >
            <View
              ref={canvasContainerRef}
              style={{ width: canvasWidth, height: canvasHeight }}
              onLayout={updateCanvasOffset}
            >
              <GraphCanvas
                key={mountKey}
                renderNodes={renderNodes}
                renderLinks={renderLinks}
                connectedNodeIds={connectedNodeIds}
                connectedLinkIds={connectedLinkIds}
                nodeDepths={showKinshipColors ? nodeDepths : new Map<string, number>()}
                isSelectionActive={effectiveSelectionActive}
                panGesture={panGesture}
                renderTick={renderTick}
                scale={scale}
                translateX={translateX}
                translateY={translateY}
              />
            </View>
            {/* 앱 아이콘과 이름 오버레이 (오른쪽 밑) - 캡처 시에만 보임 */}
            <View
              ref={appBrandingRef}
              style={{
                position: 'absolute',
                right: 12,
                bottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                opacity: 0, // 화면에서는 숨김, 캡처 시에만 보임
              }}
              pointerEvents="none"
            >
              <Image
                source={require('@assets/pngs/AppIcon64.png')}
                style={{ width: 24, height: 24, borderRadius: 6 }}
                resizeMode="cover"
              />
              <Text
                text="LinkNote"
                type="body3"
                className="text-white"
                style={{ fontSize: 12, fontWeight: '600' }}
              />
            </View>
          </View>
        )}
      </View>
      {!isSubscribed && <AdmobNative />}
      <TabBar />
    </Background>
  );
};
