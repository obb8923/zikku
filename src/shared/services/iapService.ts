import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  Purchase,
  Product,
  ProductOrSubscription,
  PurchaseIOS,
  PurchaseAndroid,
} from 'react-native-iap';
import { Platform, Alert } from 'react-native';
import { getSubscriptionProductIds } from '@constants/IAP_PRODUCTS';
import { SubscriptionInfo, PurchaseInfo } from '@shared-types/subscriptionType';

// 리스너 중복 등록 방지 flag
let _isListenerRegistered = false;
let _purchaseUpdateSubscription: any = null;
let _purchaseErrorSubscription: any = null;
let _isInitializing = false;


//  * Nitro Modules 에러인지 확인
const isNitroModulesError = (error: any): boolean => {
  const errorMessage = error?.message || String(error);
  return (
    errorMessage.includes('Nitro runtime not installed') ||
    errorMessage.includes('NitroModules') ||
    errorMessage.includes('TurboModuleRegistry') ||
    errorMessage.includes('could not be found')
  );
};

/**
 * [1단계] IAP 초기화 & 리스너 등록
 * 
 * 앱이 켜지자마자 가장 먼저 실행되어야 합니다.
 * 결제 도중 앱이 꺼졌다 켜졌을 때 누락된 트랜잭션을 잡기 위함입니다.
 * 
 * 처리 순서:
 * 1. initConnection() - IAP 연결 초기화
 * 2. purchaseUpdatedListener 등록 - 구매 결과 수신 리스너
 * 3. purchaseErrorListener 등록 - 구매 오류 수신 리스너
 * 
 * 리스너는 한 번만 등록되도록 보장되며, Nitro Modules 초기화 대기 및 재시도 로직이 포함되어 있습니다.
 */
export const initIAP = async (retryCount = 0): Promise<boolean> => {
  // 이미 초기화 중이면 스킵
  if (_isInitializing) {
    return false;
  }

  // 리스너가 이미 등록되어 있으면 성공 반환
  if (_isListenerRegistered) {
    console.log('IAP 리스너가 이미 등록되어 있습니다.');
    return true;
  }

  try {
    _isInitializing = true;

    // Nitro Modules 초기화 대기 (최대 3초, 최대 5회 재시도)
    const maxRetries = 5;
    const delayMs = 600;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        // IAP 연결 초기화
        const result = await initConnection();
        if (!result) {
          if (__DEV__) {
            console.warn('IAP 초기화 실패');
          }
          _isInitializing = false;
          return false;
        }

        // 성공적으로 초기화됨
        break;
      } catch (error: any) {
        if (isNitroModulesError(error)) {
          if (i < maxRetries) {
            // Nitro Modules가 아직 준비되지 않았으면 대기 후 재시도
            // 조용히 재시도 (콘솔 로그 제거)
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            continue;
          } else {
            // 최대 재시도 횟수 초과 - 조용히 실패 처리
            if (__DEV__) {
              console.warn(
                'IAP 초기화 실패: Nitro Modules가 준비되지 않았습니다.',
              );
            }
            _isInitializing = false;
            return false;
          }
        } else {
          // 다른 종류의 에러
          if (__DEV__) {
            console.error('IAP 초기화 중 예상치 못한 오류:', error);
          }
          _isInitializing = false;
          return false;
        }
      }
    }

    /**
     * [5단계] 구매 결과 수신 리스너 등록
     * 
     * 처리 순서:
     * 1. 영수증 검증 (스토어에서 받은 구매 정보 기반)
     * 2. 구독 상태 저장 (AsyncStorage 캐싱)
     * 3. 트랜잭션 종료 (finishTransaction)
     * 
     * 이 리스너는 앱이 켜지자마자 등록되어야 하며,
     * 결제 도중 앱이 꺼졌다 켜졌을 때 누락된 트랜잭션을 잡기 위함입니다.
     */
    _purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: Purchase) => {
        console.log('[IAP] 구매 업데이트 수신:', purchase.productId);
        try {
          // [5-1] 영수증 검증 (스토어에서 받은 구매 정보 기반)
          // 스토어에서 직접 받은 구매 정보를 검증하고 구독 상태 확인
          const subscriptionInfo = verifyReceipt(purchase);
          
          if (subscriptionInfo) {
            // [5-2] 구독 상태 저장
            // AsyncStorage에 캐싱 (캐시로만 사용)
            await updateSubscriptionStatus(subscriptionInfo);
            
            // [5-3] 트랜잭션 종료
            // 구독은 소비 가능한 상품이 아니므로 isConsumable: false
            await finishTransaction({ purchase, isConsumable: false });
            console.log('[IAP] 구매 처리 완료:', purchase.productId);
          } else {
            console.error('[IAP] 영수증 검증 실패:', purchase.productId);
            // 검증 실패 시에도 트랜잭션은 종료해야 함 (중복 처리 방지)
            await finishTransaction({ purchase, isConsumable: false });
            // 내부 테스터를 위해 Alert 표시
            Alert.alert(
              '구매 검증 실패',
              `구매한 상품의 영수증 검증에 실패했습니다.\n상품 ID: ${purchase.productId}\n\n고객센터에 문의해주세요.`,
            );
          }
        } catch (error: any) {
          console.error('[IAP] 구매 처리 중 오류:', error);
          const errorMessage = error?.message || error?.toString() || '알 수 없는 오류';
          // 내부 테스터를 위해 Alert 표시
          Alert.alert(
            '구매 처리 오류',
            `구매 처리 중 오류가 발생했습니다.\n\n오류: ${errorMessage}\n상품 ID: ${purchase.productId}\n\n고객센터에 문의해주세요.`,
          );
          // 에러 발생 시에도 트랜잭션 종료 시도
          try {
            await finishTransaction({ purchase, isConsumable: false });
          } catch (finishError: any) {
            console.error('[IAP] 트랜잭션 종료 실패:', finishError);
            const finishErrorMessage = finishError?.message || finishError?.toString() || '알 수 없는 오류';
            Alert.alert(
              '트랜잭션 종료 실패',
              `구매 트랜잭션을 종료하는 중 오류가 발생했습니다.\n\n오류: ${finishErrorMessage}\n상품 ID: ${purchase.productId}`,
            );
          }
        }
      },
    );

    // purchaseErrorListener 등록
    _purchaseErrorSubscription = purchaseErrorListener((error) => {
      console.error('[IAP] 구매 오류 수신:', error);
      console.error('[IAP] 구매 오류 상세:', {
        code: error?.code,
        message: error?.message,
        productId: error?.productId,
      });

      // 핵심: 사용자가 취소했거나(E_USER_CANCELLED) 또는
      // 시스템이 로그인/인증 과정 때문에 잠깐 취소로 인식한 경우
      // 사용자에게 에러 알림(Alert)을 띄우지 않고 조용히 함수를 끝냅니다.
      const errorCodeStr = error?.code ? String(error.code) : '';
      if (errorCodeStr === 'E_USER_CANCELLED' || errorCodeStr.toLowerCase().includes('cancel')) {
        console.log('[IAP] 사용자 취소로 인한 오류, 알림 표시 없이 종료');
        return;
      }

      // 내부 테스터를 위해 Alert 표시
      const errorMessage = error?.message || '알 수 없는 오류';
      const errorCode = error?.code ? String(error.code) : '';
      const productId = error?.productId || '';
      Alert.alert(
        '구매 오류',
        `구매 중 오류가 발생했습니다.\n\n오류: ${errorMessage}${errorCode ? `\n코드: ${errorCode}` : ''}${productId ? `\n상품 ID: ${productId}` : ''}\n\n다시 시도해주세요.`,
      );
    });

    _isListenerRegistered = true;
    _isInitializing = false;
    console.log('IAP 초기화 및 리스너 등록 완료');
    return true;
  } catch (error) {
    _isInitializing = false;
    // 에러는 이미 위에서 처리되었으므로 조용히 실패 처리
    if (__DEV__ && !isNitroModulesError(error)) {
      console.error('IAP 초기화 중 예상치 못한 오류:', error);
    }
    return false;
  }
};

/**
 * IAP 연결 종료
 */
export const endIAP = async (): Promise<void> => {
  try {
    // 리스너 제거
    if (_purchaseUpdateSubscription) {
      _purchaseUpdateSubscription.remove();
      _purchaseUpdateSubscription = null;
    }
    if (_purchaseErrorSubscription) {
      _purchaseErrorSubscription.remove();
      _purchaseErrorSubscription = null;
    }
    _isListenerRegistered = false;

    // IAP 연결 종료
    await endConnection();
  } catch (error) {
    console.error('IAP 종료 중 오류:', error);
  }
};

/**
 * [2단계] 구독 상품 목록 조회
 * 
 * react-native-iap v14 API 사용: fetchProducts({skus: [...], type: 'subs'})
 */
export interface SubscriptionProductsResult {
  products: ProductOrSubscription[];
  errorType?: 'init_failed' | 'no_product_ids' | 'store_empty' | 'filtered_empty' | 'network_error' | 'unknown';
  errorMessage?: string;
}

export const getSubscriptionProducts = async (): Promise<SubscriptionProductsResult> => {
  console.log('[IAP] getSubscriptionProducts 호출됨');
  try {
    // IAP가 초기화되지 않았으면 초기화 시도
    if (!_isListenerRegistered) {
      console.log('[IAP] IAP 초기화 시도 중...');
      const initialized = await initIAP();
      if (!initialized) {
        console.warn('[IAP] IAP가 초기화되지 않아 구독 상품을 조회할 수 없습니다.');
        return {
          products: [],
          errorType: 'init_failed',
          errorMessage: 'IAP 초기화에 실패했습니다. 앱을 재시작해주세요.',
        };
      }
    }

    const productIds = getSubscriptionProductIds();
    console.log('[IAP] 조회할 상품 ID:', productIds);
    console.log('[IAP] 상품 ID 개수:', productIds.length);
    
    if (productIds.length === 0) {
      console.warn('[IAP] 구독 상품 ID가 설정되지 않았습니다. IAP_PRODUCTS.ts 파일에 상품 ID를 추가하세요.');
      return {
        products: [],
        errorType: 'no_product_ids',
        errorMessage: '구독 상품 ID가 설정되지 않았습니다.',
      };
    }
    
    // react-native-iap v14 API: fetchProducts({skus: [...], type: 'subs'})
    console.log('[IAP] fetchProducts 호출 중...', { skus: productIds, type: 'subs' });
    const products = await fetchProducts({ skus: productIds, type: 'subs' });
    
    console.log('[IAP] fetchProducts 결과:', products ? `${products.length}개 상품` : 'null');
    if (products && products.length > 0) {
      console.log('[IAP] 받은 상품 목록:', products.map((p: any) => ({
        id: p.id || p.productId,
        type: p.type,
        title: p.title,
        displayPrice: p.displayPrice,
        localizedPrice: p.localizedPrice,
        price: p.price,
      })));
    } else {
      console.warn('[IAP] 스토어에서 상품을 받지 못했습니다. 상품이 스토어에 등록되어 있고 활성화되어 있는지 확인하세요.');
      return {
        products: [],
        errorType: 'store_empty',
        errorMessage: `스토어에서 상품을 찾을 수 없습니다.\n\n확인 사항:\n1. Google Play Console / App Store Connect에서 상품이 활성화되어 있는지 확인\n2. 상품 ID가 정확한지 확인: ${productIds.join(', ')}\n3. 앱이 스토어를 통해 설치되었는지 확인 (직접 빌드한 APK는 작동하지 않을 수 있음)\n4. 테스트 계정이 라이선스 테스터로 등록되어 있는지 확인\n5. 상품 활성화 후 최대 24시간 소요될 수 있음`,
      };
    }
    
    // 구독 상품만 필터링해서 반환
    const filtered = (products || []).filter((p: ProductOrSubscription) => p.type === 'subs');
    
    console.log('[IAP] 필터링된 구독 상품:', filtered.length, '개');
    
    if (filtered.length === 0 && products && products.length > 0) {
      console.warn('[IAP] 받은 상품 중 구독 상품이 없습니다. 받은 상품 타입:', products.map((p: any) => p.type));
      return {
        products: [],
        errorType: 'filtered_empty',
        errorMessage: '받은 상품 중 구독 상품이 없습니다.',
      };
    }
    
    return { products: filtered };
  } catch (error: any) {
    if (isNitroModulesError(error)) {
      console.warn('[IAP] 구독 상품 조회 실패: Nitro Modules가 준비되지 않았습니다.', error);
      return {
        products: [],
        errorType: 'init_failed',
        errorMessage: 'IAP 모듈 초기화에 실패했습니다. 앱을 재시작해주세요.',
      };
    } else {
      console.error('[IAP] 구독 상품 조회 실패:', error);
      console.error('[IAP] 에러 상세:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
      return {
        products: [],
        errorType: 'unknown',
        errorMessage: `구독 상품 조회 중 오류가 발생했습니다.\n\n오류: ${error?.message || '알 수 없는 오류'}\n\n확인 사항:\n1. 인터넷 연결 상태 확인\n2. Google Play 서비스가 최신인지 확인\n3. 앱을 재시작해보세요`,
      };
    }
  }
};

/**
 * [4단계] 구매 요청
 * 
 * react-native-iap v14 공식 문서 기반 구현
 * 공식 문서: https://hyochan.github.io/react-native-iap/docs/examples/subscription-flow
 * 
 * - iOS: request.request.ios.sku (string)
 * - Android: request.request.android.skus (string[])
 * - Android Billing v5+ 구독: subscriptionOffers 배열에 offerToken 포함 필요
 * - Android 구독 상품은 subscriptionOfferDetailsAndroid 속성 사용
 * 
 * 구매 결과는 purchaseUpdatedListener에서 수신됩니다.
 * 
 * @param productId 구매할 상품 ID
 * @param product 상품 정보 (Android의 경우 offerToken을 찾기 위해 필요)
 */
export const requestSubscriptionPurchase = async (
  productId: string,
  product?: ProductOrSubscription,
): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      // Android: skus에 string[] 형태로 전달, Android Billing v5+는 offerToken 필수
      const androidProduct = product as any;
      const subscriptionOfferDetailsAndroid = androidProduct?.subscriptionOfferDetailsAndroid;
      const subscriptionOfferDetails = subscriptionOfferDetailsAndroid || androidProduct?.subscriptionOfferDetails;
      
      if (subscriptionOfferDetails && subscriptionOfferDetails.length > 0) {
        // 선택된 offerToken이 있으면 그것만 사용, 없으면 모든 offer 포함
        const selectedOfferToken = (product as any)?.selectedOfferToken;
        const subscriptionSku = (product as any)?.id || productId;
        
        let subscriptionOffers;
        if (selectedOfferToken) {
          // 선택된 offerToken만 사용
          subscriptionOffers = [{
            sku: subscriptionSku,
            offerToken: selectedOfferToken,
          }];
          console.log('[IAP] 선택된 offerToken 사용:', selectedOfferToken.substring(0, 20) + '...');
        } else {
          // 모든 offer 포함
          subscriptionOffers = subscriptionOfferDetails.map((offer: any) => ({
            sku: subscriptionSku,
            offerToken: offer.offerToken,
          }));
          console.log('[IAP] 모든 offer 포함:', subscriptionOffers.length, '개');
        }
        await requestPurchase({
          type: 'subs',
          request: {
            android: {
              skus: [productId], // string[] 형태
              subscriptionOffers,
            },
          },
        });
      } else {
        console.warn('[IAP] Android 구독 상품에 offerToken이 없습니다. 기본 요금제로 구매 시도합니다.');
        await requestPurchase({
          type: 'subs',
          request: {
            android: { skus: [productId] }, // string[] 형태
          },
        });
      }
    } else {
      // iOS: sku에 string 형태로 전달
      await requestPurchase({
        type: 'subs',
        request: {
          ios: { sku: productId }, // string 형태
        },
      });
    }
    return true;
  } catch (error: any) {
    console.error('[IAP] 구매 요청 실패:', error);
    console.error('[IAP] 에러 상세:', {
      code: error?.code,
      message: error?.message,
      responseCode: error?.responseCode,
      debugMessage: error?.debugMessage,
      productId: error?.productId,
      stack: error?.stack,
    });
    // 에러를 다시 throw하여 호출자가 상세한 에러 정보를 받을 수 있도록 함
    throw error;
  }
};

/**
 * [5-1] 영수증 검증
 * 
 * 스토어에서 받은 구매 정보를 기반으로 구독 상태를 확인합니다.
 * AsyncStorage는 캐시로만 사용하며, 실제 검증은 스토어 정보를 기반으로 수행합니다.
 * 
 * @param purchase 스토어에서 받은 구매 정보
 * @returns 구독 상태 정보 또는 null (검증 실패)
 */
export const verifyReceipt = (purchase: Purchase): SubscriptionInfo | null => {
  try {
    if (Platform.OS === 'ios') {
      const iosPurchase = purchase as PurchaseIOS;
      // iOS: transactionId 확인
      if (!iosPurchase.transactionId || iosPurchase.transactionId.length === 0) {
        console.error('[IAP] iOS 거래 ID가 없습니다.');
        return null;
      }
    } else {
      const androidPurchase = purchase as PurchaseAndroid;
      // Android: purchaseToken 확인
      if (!androidPurchase.purchaseToken || androidPurchase.purchaseToken.length === 0) {
        console.error('[IAP] Android purchaseToken이 없습니다.');
        return null;
      }
    }

    // 스토어에서 받은 구매 정보를 기반으로 구독 상태 확인
    return checkSubscriptionStatus(purchase);
  } catch (error) {
    console.error('[IAP] 영수증 검증 실패:', error);
    return null;
  }
};

/**
 * 구독 상태 확인
 * 
 * 스토어에서 받은 구매 정보를 기반으로 구독 상태를 확인합니다.
 * iOS는 expirationDateIOS와 isAutoRenewing을 사용하고,
 * Android는 purchaseState와 isAutoRenewing을 사용합니다.
 */
export const checkSubscriptionStatus = (
  purchase: Purchase,
): SubscriptionInfo => {
  const now = Date.now();

  // iOS 구독 상태 확인
  if (Platform.OS === 'ios') {
    const iosPurchase = purchase as PurchaseIOS;
    // expirationDateIOS는 이미 number 타입
    const expiresDate = iosPurchase.expirationDateIOS ?? null;
    // iOS에서는 구독이 활성화되어 있으면 자동 갱신으로 간주
    const autoRenewStatus = iosPurchase.isAutoRenewing ?? false;

    if (expiresDate && expiresDate > now && autoRenewStatus) {
      return {
        isSubscribed: true,
        subscriptionExpiryDate: expiresDate,
        autoRenewStatus: true,
        productId: purchase.productId,
        status: 'active',
      };
    } else if (expiresDate && expiresDate > now) {
      return {
        isSubscribed: true,
        subscriptionExpiryDate: expiresDate,
        autoRenewStatus: false,
        productId: purchase.productId,
        status: 'active',
      };
    } else {
      return {
        isSubscribed: false,
        subscriptionExpiryDate: expiresDate,
        autoRenewStatus: false,
        productId: purchase.productId,
        status: 'expired',
      };
    }
  }

  // Android 구독 상태 확인
  if (Platform.OS === 'android') {
    const androidPurchase = purchase as PurchaseAndroid;
    const purchaseState = androidPurchase.purchaseState;
    // Android에는 expirationDateAndroid 필드가 없으므로 purchaseState와 isAutoRenewing으로 판단
    const expiresDate = null;
    const autoRenewStatus = androidPurchase.isAutoRenewing ?? false;

    if (purchaseState === 'purchased') {
      if (autoRenewStatus) {
        return {
          isSubscribed: true,
          subscriptionExpiryDate: expiresDate,
          autoRenewStatus: autoRenewStatus,
          productId: purchase.productId,
          status: 'active',
        };
      } else {
        return {
          isSubscribed: false,
          subscriptionExpiryDate: expiresDate,
          autoRenewStatus: false,
          productId: purchase.productId,
          status: 'expired',
        };
      }
    } else {
      return {
        isSubscribed: false,
        subscriptionExpiryDate: expiresDate,
        autoRenewStatus: false,
        productId: purchase.productId,
        status: 'expired',
      };
    }
  }

  // 기본값
  return {
    isSubscribed: false,
    subscriptionExpiryDate: null,
    autoRenewStatus: false,
    productId: null,
    status: 'none',
  };
};

/**
 * [5-2] 구독 상태 저장
 * 
 * 스토어에서 받은 구매 정보를 기반으로 확인한 구독 상태를 AsyncStorage에 캐싱합니다.
 * AsyncStorage는 캐시로만 사용하며, 실제 구독 상태는 스토어 정보를 기반으로 확인합니다.
 * 
 * @param subscriptionInfo 구독 상태 정보
 */
const updateSubscriptionStatus = async (
  subscriptionInfo: SubscriptionInfo,
): Promise<void> => {
  // AsyncStorage에 캐싱 (캐시로만 사용)
  // 앱 재시작 시 빠른 로딩을 위해 로컬에 캐싱
  const { useSubscriptionStore } = await import('@stores/subscriptionStore');
  useSubscriptionStore.getState().updateSubscriptionInfo(subscriptionInfo);
  
  console.log('[IAP] 구독 상태 업데이트 완료 (캐시):', subscriptionInfo);
};

/**
 * [9단계] 구매 복원 - 기존 구매 조회 및 재검증
 * 
 * 앱 실행 시 또는 사용자가 '구매 복원' 버튼을 클릭했을 때 호출됩니다.
 * getAvailablePurchases()를 통해 기존 구매 내역을 조회하고 재검증합니다.
 */
export const getAvailablePurchasesAndVerify = async (): Promise<
  PurchaseInfo[]
> => {
  try {
    // IAP가 초기화되지 않았으면 초기화 시도
    if (!_isListenerRegistered) {
      const initialized = await initIAP();
      if (!initialized) {
        // 조용히 실패 처리 (콘솔 로그 제거)
        return [];
      }
    }

    const purchases = await getAvailablePurchases();
    const verifiedPurchases: PurchaseInfo[] = [];

    for (const purchase of purchases) {
      // 스토어에서 받은 구매 정보를 기반으로 검증
      const subscriptionInfo = verifyReceipt(purchase);
      
      if (subscriptionInfo && subscriptionInfo.isSubscribed) {
        // 유효한 구독만 추가
        verifiedPurchases.push({
          purchase,
          isValid: true,
        });
      }
    }

    // 만료일이 가장 늦은 구독을 찾아서 상태 업데이트
    if (verifiedPurchases.length > 0) {
      const latestPurchase = verifiedPurchases.reduce((latest, current) => {
        // iOS는 expirationDateIOS 사용, Android는 transactionDate 사용
        const latestExpiry = Platform.OS === 'ios'
          ? (latest.purchase as PurchaseIOS).expirationDateIOS ?? 0
          : latest.purchase.transactionDate;
        const currentExpiry = Platform.OS === 'ios'
          ? (current.purchase as PurchaseIOS).expirationDateIOS ?? 0
          : current.purchase.transactionDate;
        return currentExpiry > latestExpiry ? current : latest;
      });

      // 스토어에서 받은 구매 정보를 기반으로 구독 상태 확인
      const subscriptionInfo = verifyReceipt(latestPurchase.purchase);
      if (subscriptionInfo) {
        await updateSubscriptionStatus(subscriptionInfo);
      }
    } else {
      // 유효한 구독이 없으면 상태 초기화
      const { useSubscriptionStore } = await import('@stores/subscriptionStore');
      useSubscriptionStore.getState().updateSubscriptionInfo({
        isSubscribed: false,
        subscriptionExpiryDate: null,
        autoRenewStatus: false,
        productId: null,
        status: 'none',
      });
    }

    return verifiedPurchases;
  } catch (error: any) {
    // 조용히 실패 처리 (에러 로깅 최소화)
    if (__DEV__ && !isNitroModulesError(error)) {
      console.error('구매 조회 및 검증 실패:', error);
    }
    return [];
  }
};

/**
 * [9단계] 구매 복원
 * 
 * 사용자가 '구매 복원' 버튼을 클릭했을 때 호출됩니다.
 * 현재 유효한 구매 내역을 모두 가져와서 검증하고 구독 상태를 복원합니다.
 */
export const restorePurchases = async (): Promise<PurchaseInfo[]> => {
  try {
    console.log('[IAP] 구매 복원 시작');
    
    // 현재 유효한 구매 내역(영수증)을 모두 가져옴
    const purchases = await getAvailablePurchases();
    console.log('[IAP] 가져온 구매 내역:', purchases.length, '개');
    
    if (purchases.length === 0) {
      console.log('[IAP] 복원할 구매 내역이 없습니다.');
      return [];
    }
    
    // 가져온 내역들 중 내 앱의 구독 상품이 있는지 확인
    const productIds = getSubscriptionProductIds();
    const verifiedPurchases: PurchaseInfo[] = [];
    
    for (const purchase of purchases) {
      // 스토어에서 받은 구매 정보를 기반으로 검증
      if (productIds.includes(purchase.productId)) {
        const subscriptionInfo = verifyReceipt(purchase);
        
        if (subscriptionInfo && subscriptionInfo.isSubscribed) {
          // 유효한 구독만 추가
          verifiedPurchases.push({
            purchase,
            isValid: true,
          });
        }
      }
    }
    
    // 만료일이 가장 늦은 구독을 찾아서 상태 업데이트
    if (verifiedPurchases.length > 0) {
      const latestPurchase = verifiedPurchases.reduce((latest, current) => {
        const latestExpiry = Platform.OS === 'ios'
          ? (latest.purchase as PurchaseIOS).expirationDateIOS ?? 0
          : latest.purchase.transactionDate;
        const currentExpiry = Platform.OS === 'ios'
          ? (current.purchase as PurchaseIOS).expirationDateIOS ?? 0
          : current.purchase.transactionDate;
        return currentExpiry > latestExpiry ? current : latest;
      });
      
      // 구독 상태 저장 (AsyncStorage 캐싱)
      // 스토어에서 받은 구매 정보를 기반으로 구독 상태 확인
      const { useSubscriptionStore } = await import('@stores/subscriptionStore');
      const subscriptionInfo = verifyReceipt(latestPurchase.purchase);
      if (subscriptionInfo) {
        useSubscriptionStore.getState().updateSubscriptionInfo(subscriptionInfo);
      }
      
      console.log('[IAP] 구매 복원 완료:', verifiedPurchases.length, '개 구매 복원됨');
      return verifiedPurchases;
    } else {
      // 유효한 구독이 없으면 상태 초기화
      const { useSubscriptionStore } = await import('@stores/subscriptionStore');
      useSubscriptionStore.getState().updateSubscriptionInfo({
        isSubscribed: false,
        subscriptionExpiryDate: null,
        autoRenewStatus: false,
        productId: null,
        status: 'none',
      });
      console.log('[IAP] 유효한 구독 내역이 없습니다.');
      return [];
    }
  } catch (error) {
    console.error('[IAP] 구매 복원 실패:', error);
    return [];
  }
};

