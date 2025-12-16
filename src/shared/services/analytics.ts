import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';
import { useTrackingStore } from '@stores/trackingStore';

// GA4 이벤트 스키마 정의
type AnalyticsEventMap = {
  onboarding_complete: { method?: 'button' | 'auto' };
  tracking_consent: { status: 'authorized' | 'denied' | 'not-determined' | 'restricted' };
  people_add_entrypoint: { method: 'manual' | 'contacts' };
  person_added: { source: 'manual' | 'contacts'; property_count: number; has_memo: boolean };
  person_import_contacts: { count: number };
  relation_added: { strength: number; arrow: string; has_description: boolean };
  person_view: { person_id: string };
  person_updated: { property_count: number; has_memo: boolean };
  person_deleted: { reason?: 'manual' };
  graph_share: { node_count: number; link_count: number };
  graph_node_select: { node_id?: string };
  graph_filter_change: { type: 'group' | 'tag' | null; value?: string | null };
  graph_kinship_toggle: { enabled: boolean };
  subscription_view: { entry?: 'settings' | 'graph' | 'iap_prompt' };
  subscription_plan_select: { plan: 'monthly' | 'yearly' | 'unknown' };
  subscription_purchase_start: { product_id?: string };
  subscription_purchase_success: { product_id?: string };
  subscription_purchase_fail: { product_id?: string; code?: string };
  subscription_restore: { status: 'success' | 'fail' };
  setting_language_change: { code: string };
  setting_theme_change: { mode: string };
  setting_feedback_open: Record<string, never>;
  app_rate_open: { platform: string };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;
export type AnalyticsEventParams<T extends AnalyticsEventName> = AnalyticsEventMap[T];

const toSnake = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();

const normalizeParams = (params: Record<string, any> | undefined) => {
  if (!params) return undefined;
  return Object.entries(params).reduce<Record<string, any>>((acc, [key, val]) => {
    acc[toSnake(key)] = val;
    return acc;
  }, {});
};

const isCollectionEnabled = () => {
  // 추적 권한이 있을 때만 수집 (필요 시 추가 조건을 중앙에서 관리)
  return useTrackingStore.getState().isTrackingAuthorized;
};

export const logEvent = async <T extends AnalyticsEventName>(
  name: T,
  params?: AnalyticsEventParams<T>,
) => {
  if (!isCollectionEnabled()) return;
  try {
    const eventName = toSnake(name);
    const normalized = normalizeParams(params as Record<string, any>);
    if (__DEV__) {
      // 개발 환경에서는 서버 전송 대신 콘솔만 찍어 데이터 오염 방지
      console.log('[Analytics][DEV]', eventName, normalized ?? {});
      return;
    }
    await analytics().logEvent(eventName, normalized);
  } catch (error) {
    if (__DEV__) {
      console.warn('[Analytics] logEvent 실패', name, error);
    }
  }
};

export const logScreenView = async (screenName: string, screenClass?: string) => {
  if (!isCollectionEnabled()) return;
  try {
    const screen_name = toSnake(screenName);
    const screen_class = toSnake(screenClass || screenName);
    if (__DEV__) {
      console.log('[Analytics][DEV] screen_view', { screen_name, screen_class });
      return;
    }
    await analytics().logScreenView({
      screen_name,
      screen_class,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[Analytics] logScreenView 실패', screenName, error);
    }
  }
};

export const setUserId = async (userId: string | null) => {
  if (!isCollectionEnabled()) return;
  try {
    await analytics().setUserId(userId);
  } catch (error) {
    if (__DEV__) {
      console.warn('[Analytics] setUserId 실패', userId, error);
    }
  }
};

export const setUserProperty = async (name: string, value: string | null) => {
  if (!isCollectionEnabled()) return;
  try {
    await analytics().setUserProperty(name, value);
  } catch (error) {
    if (__DEV__) {
      console.warn('[Analytics] setUserProperty 실패', name, error);
    }
  }
};

// 편의용: 플랫폼 식별자
export const platformLabel = Platform.OS === 'ios' ? 'ios' : 'android';

