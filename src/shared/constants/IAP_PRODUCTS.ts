import { Platform } from 'react-native';

/**
 * 구독 상품 ID 설정
 * 
 * 사용 방법:
 * 1. App Store Connect (iOS) 또는 Google Play Console (Android)에서 구독 상품을 생성
 * 2. 생성한 상품의 Product ID를 아래 배열에 추가
 * 
 * 예시:
 * - iOS: 'com.jeong.linknote.premium.monthly'
 * - Android: 'com.jeong.linknote.premium.monthly'
 * 
 * 참고:
 * - iOS와 Android의 상품 ID는 동일하거나 다를 수 있습니다
 * - 여러 구독 상품을 추가하려면 배열에 여러 ID를 추가하세요
 */

// iOS 구독 상품 ID
export const IOS_SUBSCRIPTION_PRODUCT_IDS = [
  'LinkNote_Yearly',
  'LinkNote_Monthly',
] as const;

// Android 구독 상품 ID
export const ANDROID_SUBSCRIPTION_PRODUCT_IDS = [
  'linknote_',
] as const;

// 현재 플랫폼에 맞는 구독 상품 ID 반환
export const getSubscriptionProductIds = (): string[] => {
  if (Platform.OS === 'ios') {
    return [...IOS_SUBSCRIPTION_PRODUCT_IDS];
  }
  return [...ANDROID_SUBSCRIPTION_PRODUCT_IDS];
};

