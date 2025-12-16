import { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
  View,
  ScrollView,
  useWindowDimensions,
  Image,
  Text as RNText,
} from 'react-native';

import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductOrSubscription } from 'react-native-iap';
import { Background, Text } from '@components/index';
import { useColors } from '@shared/hooks/useColors';
import { useThemeStore } from '@stores/themeStore';
import { useSubscriptionStore } from '@stores/subscriptionStore';
import {
  getSubscriptionProducts,
  requestSubscriptionPurchase,
  restorePurchases,
  SubscriptionProductsResult,
} from '@services/iapService';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@shared/constants/legalLinks';
import type { SettingStackParamList } from '@nav/stack/SettingStack';
import XIcon from '@assets/svgs/X.svg';
import PhoneIcon from '@assets/svgs/Phone.svg';
import CalendarIcon from '@assets/svgs/Calendar.svg';
import LikeIcon from '@assets/svgs/Like.svg';
import StarIcon from '@assets/svgs/Star.svg';
import DisLikeIcon from '@assets/svgs/DisLike.svg';
import { logEvent } from '@services/analytics';
interface CarouselSlide {
  id: string;
  image?: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
}

type SubscriptionNavProp = NativeStackNavigationProp<SettingStackParamList>;

export const SubscriptionScreen = () => {
  const colors = useColors();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<SubscriptionNavProp>();
  const { width } = useWindowDimensions();
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const subscriptionInfo = useSubscriptionStore((state) => state.subscriptionInfo);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const refreshSubscriptionStatus = useSubscriptionStore(
    (state) => state.refreshSubscriptionStatus,
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);

  const [products, setProducts] = useState<ProductOrSubscription[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [monthlyProduct, setMonthlyProduct] = useState<ProductOrSubscription | null>(null);
  const [yearlyProduct, setYearlyProduct] = useState<ProductOrSubscription | null>(null);
  const [monthlyOffer, setMonthlyOffer] = useState<any>(null);
  const [yearlyOffer, setYearlyOffer] = useState<any>(null);
  const [loadError, setLoadError] = useState<{ type?: string; message?: string } | null>(null);

  // 3, 4, 5번째 슬라이드용 커스텀 컴포넌트 렌더링 함수
  const renderCustomSlideContent = (slideIndex: number): React.ReactNode => {
    switch (slideIndex) {
      case 2: // 3번째 슬라이드 (index 2)
        return (
        <View className="h-full w-full">
          <View className="flex-row items-center justify-center h-1/3 w-full">
          <LikeIcon width={30} height={30} color={colors.TEXT_2} />
            <RNText
            style={{fontSize: 30, fontWeight: 600,color: colors.TEXT_2,marginLeft: 10,marginRight:20}}>
              {t('property.labels.likes')}
            </RNText>
            <PhoneIcon width={30} height={30} color={colors.TEXT_2} />
            <RNText
            style={{fontSize: 30, fontWeight: 600,color: colors.TEXT_2,marginLeft: 10}}>
              {t('property.labels.phone')}
            </RNText>
          </View>
          <View className="py-4 flex-row items-center justify-center h-1/3 w-full">
            <StarIcon width={40} height={40} color={colors.PRIMARY} />
            <RNText
            style={{fontSize: 40, fontWeight: 600,color: colors.PRIMARY,marginLeft: 10}}>
              {t('property.labels.custom')}
            </RNText>
          </View>
          <View className="py-4 flex-row items-center justify-center h-1/3 w-full">
          <CalendarIcon width={30} height={30} color={colors.TEXT_2} />
            <RNText
            style={{fontSize: 30, fontWeight: 600,color: colors.TEXT_2,marginLeft: 10,marginRight:20}}>
              {t('property.labels.birthday')}
            </RNText>
            <DisLikeIcon width={30} height={30} color={colors.TEXT_2} />
            <RNText
            style={{fontSize: 30, fontWeight: 600,color: colors.TEXT_2,marginLeft: 10}}>
              {t('property.labels.dislikes')}
            </RNText>
          </View>
        </View>
        );
      case 3: 
      return(
        <View className="h-full w-full items-center justify-center px-8">

        <Text
          text={t('subscriptionScreen.carousel.4.body')}
          type="body1"
          style={{ color: colors.TEXT_2 }}
          numberOfLines={10}
        />
        </View>

      );
      case 4: 
      return(
        <View className="h-full w-full items-center justify-center relative">
          <RNText 
          className="text-text font-bold"
          style={{fontSize: 90}}>
            {`{ ADS }`}
          </RNText>
          <View className="absolute">
            <RNText
            className="text-text-2 "
            style={{fontSize: 200,fontWeight: 200}}>
              {` X `}
            </RNText>
          </View>
        </View>
      );
      default:
        return null;
    }
  };

  // 캐루셀 데이터
  const carouselSlides: CarouselSlide[] = [
    {
      id: '1',
      titleKey: 'subscriptionScreen.carousel.1.title',
      descriptionKey: 'subscriptionScreen.carousel.1.description',
    },
    {
      id: '2',
      titleKey: 'subscriptionScreen.carousel.2.title',
      descriptionKey: 'subscriptionScreen.carousel.2.description',
    },
    {
      id: '3',
      titleKey: 'subscriptionScreen.carousel.3.title',
      descriptionKey: 'subscriptionScreen.carousel.3.description',
    },
    {
      id: '4',
      titleKey: 'subscriptionScreen.carousel.4.title',
      descriptionKey: 'subscriptionScreen.carousel.4.description',
    },
    {
      id: '5',
      titleKey: 'subscriptionScreen.carousel.5.title',
      descriptionKey: 'subscriptionScreen.carousel.5.description',
    },
  ];

  const getProductId = (product: ProductOrSubscription | null | undefined): string | null => {
    if (!product) return null;
    return (product as any).productId || (product as any).id || null;
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // 플랜이 로드되면 기본 선택 설정
  useEffect(() => {
    if (!selectedPlan) {
      if (yearlyProduct) {
        setSelectedPlan('yearly');
      } else if (monthlyProduct) {
        setSelectedPlan('monthly');
      }
    }
  }, [yearlyProduct, monthlyProduct, selectedPlan]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setLoadError(null);
      if (__DEV__) {
        console.log('[SubscriptionSection] 구독 상품 로드 시작');
      }
      const result: SubscriptionProductsResult = await getSubscriptionProducts();

      if (__DEV__) {
        console.log('[SubscriptionSection] 받은 상품 개수:', result.products.length);
        if (result.errorType) {
          console.warn('[SubscriptionSection] 에러 타입:', result.errorType);
          console.warn('[SubscriptionSection] 에러 메시지:', result.errorMessage);
        }
      }

      if (result.errorType && result.errorMessage) {
        const loadErrorTitle = t('subscriptionScreen.alerts.loadProductsTitle');
        setLoadError({
          type: result.errorType,
          message: result.errorMessage,
        });
        Alert.alert(loadErrorTitle, result.errorMessage);
      }

      setProducts(result.products);

      let monthly: ProductOrSubscription | undefined;
      let yearly: ProductOrSubscription | undefined;
      let monthlyOfferInfo: any = null;
      let yearlyOfferInfo: any = null;

      if (Platform.OS === 'android') {
        if (result.products.length > 0) {
          const product = result.products[0];
          const androidProduct = product as any;
          const subscriptionOfferDetails = androidProduct?.subscriptionOfferDetailsAndroid || [];

          console.log(
            '[SubscriptionSection] subscriptionOfferDetails:',
            JSON.stringify(subscriptionOfferDetails, null, 2),
          );

          for (const offer of subscriptionOfferDetails) {
            const basePlanId = (offer?.basePlanId || '').toLowerCase();
            const offerToken = offer?.offerToken || '';

            console.log('[SubscriptionSection] offer 확인:', {
              basePlanId,
              offerToken: offerToken ? `${offerToken.substring(0, 20)}...` : '없음',
              pricingPhases: offer?.pricingPhases,
            });

            if (basePlanId.includes('month')) {
              monthly = product;
              monthlyOfferInfo = offer;
              console.log(
                '[SubscriptionSection] 월간 상품 발견:',
                basePlanId,
                'offerToken:',
                offerToken ? '있음' : '없음',
              );
            }
            if (basePlanId.includes('year')) {
              yearly = product;
              yearlyOfferInfo = offer;
              console.log(
                '[SubscriptionSection] 연간 상품 발견:',
                basePlanId,
                'offerToken:',
                offerToken ? '있음' : '없음',
              );
            }
          }
        }
      } else {
        for (const product of result.products) {
          const pid = getProductId(product)?.toLowerCase() || '';
          const title = (product.title || '').toLowerCase();

          if (pid.includes('month') || title.includes('month') || title.includes('월간')) {
            monthly = product;
            console.log('[SubscriptionSection] iOS 월간 상품 발견:', pid);
          }
          if (
            pid.includes('year') ||
            pid.includes('yearly') ||
            title.includes('year') ||
            title.includes('yearly') ||
            title.includes('연간')
          ) {
            yearly = product;
            console.log('[SubscriptionSection] iOS 연간 상품 발견:', pid);
          }
        }
      }

      if (result.products.length === 1 && !monthly && !yearly) {
        const product = result.products[0];
        monthly = product;
        yearly = product;
        console.warn('[SubscriptionSection] 월간/연간 구분 실패. 두 카드 모두 같은 상품 표시');
      }

      if (Platform.OS === 'android') {
        if (monthly && monthlyOfferInfo) {
          (monthly as any).selectedOffer = monthlyOfferInfo;
          (monthly as any).selectedOfferToken = monthlyOfferInfo.offerToken;
        }
        if (yearly && yearlyOfferInfo) {
          (yearly as any).selectedOffer = yearlyOfferInfo;
          (yearly as any).selectedOfferToken = yearlyOfferInfo.offerToken;
        }
      }

      setMonthlyOffer(monthlyOfferInfo);
      setYearlyOffer(yearlyOfferInfo);

      if (__DEV__) {
        console.log('[SubscriptionSection] 월간 상품:', monthly ? getProductId(monthly) : '없음');
        console.log('[SubscriptionSection] 연간 상품:', yearly ? getProductId(yearly) : '없음');
      }

      setMonthlyProduct(monthly || null);
      setYearlyProduct(yearly || null);
    } catch (error: any) {
      console.error('[SubscriptionSection] 구독 상품 로드 실패:', error);
      const errorMessage = error?.message || error?.toString() || t('subscriptionScreen.alerts.unknownError');
      const errorInfo = {
        type: 'unknown',
        message: t('subscriptionScreen.alerts.loadProductsUnknown', { error: errorMessage }),
      };
      setLoadError(errorInfo);

      Alert.alert(t('subscriptionScreen.alerts.loadProductsTitle'), errorInfo.message);

      if (__DEV__) {
        console.error('[SubscriptionSection] 에러 상세:', error);
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  const handlePurchase = async (productId: string, isMonthly: boolean = false) => {
    try {
      setPurchasing(true);

      const product = products.find((p) => {
        const pid = getProductId(p);
        return pid === productId;
      });

      if (!product) {
        Alert.alert(
          t('subscriptionScreen.alerts.purchaseFailedTitle'),
          t('subscriptionScreen.alerts.productNotFound', { id: productId }),
        );
        return;
      }

      let offerToken: string | null = null;
      if (Platform.OS === 'android') {
        if (isMonthly && monthlyOffer) {
          offerToken = monthlyOffer.offerToken || null;
        } else if (!isMonthly && yearlyOffer) {
          offerToken = yearlyOffer.offerToken || null;
        }

        if (!offerToken) {
          const selectedOffer = (product as any).selectedOffer;
          if (selectedOffer) {
            offerToken = selectedOffer.offerToken || null;
          } else {
            const androidProduct = product as any;
            const subscriptionOfferDetails = androidProduct?.subscriptionOfferDetailsAndroid || [];
            const targetBasePlan = isMonthly ? 'month' : 'year';

            for (const offer of subscriptionOfferDetails) {
              const basePlanId = (offer?.basePlanId || '').toLowerCase();
              if (basePlanId.includes(targetBasePlan)) {
                offerToken = offer?.offerToken || null;
                break;
              }
            }
          }
        }
      }

      if (__DEV__) {
        console.log('[SubscriptionSection] 구매 요청 시작:', {
          productId,
          isMonthly,
          offerToken: offerToken ? `${offerToken.substring(0, 20)}...` : '없음',
          product: {
            id: (product as any).id,
            productId: (product as any).productId,
            title: product.title,
            type: product.type,
          },
        });
      }

      if (offerToken) {
        (product as any).selectedOfferToken = offerToken;
      }

      logEvent('subscription_purchase_start', { product_id: productId });
      
      // 구매 전 구독 상태 저장
      const wasSubscribedBefore = subscriptionInfo.isSubscribed;
      
      try {
        await requestSubscriptionPurchase(productId, product);
        
        // 구매 요청이 성공적으로 시작되었으므로, 실제 구매 완료를 확인하기 위해 대기
        // 구매 완료는 purchaseUpdatedListener에서 처리되지만, 
        // 사용자가 뒤로 가기를 눌렀을 경우를 대비해 구독 상태를 확인
        let purchaseConfirmed = false;
        const maxAttempts = 10; // 최대 10번 확인 (약 5초)
        const checkInterval = 500; // 500ms마다 확인
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise<void>(resolve => setTimeout(resolve, checkInterval));
          await refreshSubscriptionStatus();
          
          const currentSubscriptionInfo = useSubscriptionStore.getState().subscriptionInfo;
          // 구독 상태가 변경되었거나, 이전에 구독하지 않았는데 지금 구독 중이면 구매 완료
          if (currentSubscriptionInfo.isSubscribed && 
              (currentSubscriptionInfo.productId === productId || !wasSubscribedBefore)) {
            purchaseConfirmed = true;
            break;
          }
        }
        
        if (purchaseConfirmed) {
          logEvent('subscription_purchase_success', { product_id: productId });
          Alert.alert(
            t('subscriptionScreen.alerts.purchaseRequestTitle'),
            t('subscriptionScreen.alerts.purchaseRequestMessage'),
          );
        } else {
          // 구매 요청은 시작되었지만 아직 완료되지 않았거나 취소된 경우
          // 조용히 반환 (사용자가 취소했을 가능성이 높음)
          // purchaseUpdatedListener에서 실제 구매 완료 시 처리됨
          return;
        }
      } catch (purchaseError) {
        // requestSubscriptionPurchase에서 에러가 발생한 경우는 catch 블록에서 처리됨
        throw purchaseError;
      }
    } catch (error: any) {
      console.error('[SubscriptionSection] 구매 요청 실패:', error);
      const errorMessage = error?.message || error?.toString() || t('subscriptionScreen.alerts.unknownError');
      const errorCode = error?.code || '';

      // 사용자가 결제를 취소한 경우 조용히 반환
      if (errorCode && `${errorCode}`.toLowerCase().includes('cancel')) {
        return;
      }

      logEvent('subscription_purchase_fail', { product_id: productId, code: errorCode });

      const codeLine = errorCode
        ? `\n${t('subscriptionScreen.alerts.errorCode', { code: errorCode })}`
        : '';

      Alert.alert(
        t('subscriptionScreen.alerts.purchaseFailedTitle'),
        t('subscriptionScreen.alerts.purchaseErrorMessage', { message: errorMessage, codeLine }),
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      const restoredPurchases = await restorePurchases();
      if (restoredPurchases.length > 0) {
        logEvent('subscription_restore', { status: 'success' });
        Alert.alert(
          t('subscriptionScreen.alerts.restoreSuccessTitle'),
          t('subscriptionScreen.alerts.restoreSuccessMessage'),
        );
        await refreshSubscriptionStatus();
      } else {
        logEvent('subscription_restore', { status: 'fail' });
        Alert.alert(
          t('subscriptionScreen.alerts.restoreEmptyTitle'),
          t('subscriptionScreen.alerts.restoreEmptyMessage'),
        );
      }
    } catch (error) {
      console.error('구매 복원 실패:', error);
      logEvent('subscription_restore', { status: 'fail' });
      Alert.alert(
        t('subscriptionScreen.alerts.restoreFailedTitle'),
        t('subscriptionScreen.alerts.restoreFailedMessage'),
      );
    } finally {
      setRestoring(false);
    }
  };

  const formatExpiryDate = (timestamp: number | null): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const locale = i18n.language || 'ko-KR';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusText = (): string => {
    if (subscriptionInfo.isSubscribed) {
      if (subscriptionInfo.subscriptionExpiryDate) {
        return t('setting.subscription.activeUntil', {
          date: formatExpiryDate(subscriptionInfo.subscriptionExpiryDate),
        });
      }
      return t('setting.subscription.active');
    }
    return t('setting.subscription.notSubscribed');
  };

  const getCurrentProduct = (): ProductOrSubscription | null => {
    const subId = subscriptionInfo.productId;
    if (!subId) return null;
    const match = products.find((p) => getProductId(p) === subId);
    if (match) return match;
    // 폴백: 이미 저장된 월간/연간과 비교
    if (monthlyProduct && getProductId(monthlyProduct) === subId) return monthlyProduct;
    if (yearlyProduct && getProductId(yearlyProduct) === subId) return yearlyProduct;
    return null;
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleOpenPolicy = (url: string, title: string) => {
    if (!url) {
      Alert.alert(
        t('subscriptionScreen.alerts.policyPendingTitle'),
        t('subscriptionScreen.alerts.policyPendingMessage'),
      );
      return;
    }
    const lang = i18n.language?.startsWith('en') ? 'en' : 'ko';
    const finalUrl = url.includes('lang=')
      ? url
      : `${url}${url.includes('?') ? '&' : '?'}lang=${lang}`;
    navigation.navigate('PolicyWebView', { title, url: finalUrl });
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const page = Math.round(scrollPosition / width);
    setCurrentPage(page);
  };

  const getProductPrice = (product: ProductOrSubscription | null, isMonthly: boolean): string | null => {
    if (!product) return null;

    if (Platform.OS === 'android') {
      const offerInfo = isMonthly ? monthlyOffer : yearlyOffer;
      if (offerInfo?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice) {
        return offerInfo.pricingPhases.pricingPhaseList[0].formattedPrice;
      }
    }

    return (product as any).displayPrice || (product as any).localizedPrice || null;
  };

  // 연간 가격을 월 환산해 보여주기
  const getMonthlyPriceFromYearly = (product: ProductOrSubscription | null): string | null => {
    if (!product) return null;

    // Android: 마이크로 단위 가격 사용
    if (Platform.OS === 'android') {
      const phase = yearlyOffer?.pricingPhases?.pricingPhaseList?.[0];
      if (phase?.priceAmountMicros && phase?.priceCurrencyCode) {
        const monthly = phase.priceAmountMicros / 12 / 1_000_000;
        return new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: phase.priceCurrencyCode,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(monthly);
      }
    }

    // iOS: price(숫자)와 통화 코드 사용
    const price = (product as any).price;
    const currency = (product as any).currency || (product as any).priceCurrencyCode;
    if (typeof price === 'number' && currency) {
      const monthly = price / 12;
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(monthly);
    }

    return null;
  };

  const handlePlanSelect = (plan: 'monthly' | 'yearly') => {
    if (subscriptionInfo.isSubscribed) {
      Alert.alert(
        t('subscriptionScreen.alerts.purchaseNotAllowedTitle'),
        t('subscriptionScreen.alerts.alreadySubscribed'),
      );
      return;
    }
    setSelectedPlan(plan);
    logEvent('subscription_plan_select', { plan });
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      Alert.alert(
        t('subscriptionScreen.alerts.planSelectTitle'),
        t('subscriptionScreen.alerts.planSelectMessage'),
      );
      return;
    }

    const product = selectedPlan === 'monthly' ? monthlyProduct : yearlyProduct;
    const productId = getProductId(product);

    if (!product || !productId) {
      Alert.alert(
        t('subscriptionScreen.alerts.purchaseNotAllowedTitle'),
        t('subscriptionScreen.alerts.noProductInfo'),
      );
      return;
    }

    if (subscriptionInfo.isSubscribed) {
      Alert.alert(
        t('subscriptionScreen.alerts.purchaseNotAllowedTitle'),
        t('subscriptionScreen.alerts.alreadySubscribed'),
      );
      return;
    }

    if (purchasing) {
      Alert.alert(
        t('subscriptionScreen.alerts.purchasingTitle'),
        t('subscriptionScreen.alerts.purchasingMessage'),
      );
      return;
    }

    await handlePurchase(productId, selectedPlan === 'monthly');
  };

  return (
    <Background isStatusBarGap={true}>
      <View className="flex-1 items-center justify-between">
      {/* 헤더 */}
      <View className="px-8 w-full flex-row items-center justify-between">
        <TouchableOpacity onPress={handleRestore} disabled={restoring}>
          <Text text={t('subscriptionScreen.actions.restore')}  type="body3" className="text-text-2" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGoBack}>
          <XIcon width={12} height={12} color={colors.TEXT_2} />
        </TouchableOpacity>
      </View>
      {/* 설명 캐루셀 */}
      <View className="w-full h-1/2">
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          className="flex-1"
        >
          {carouselSlides.map((slide, index) => {
            const isDarkTheme = currentTheme === 'dark';
            let imageSource;
            
            // 1, 2번째 슬라이드는 이미지 파일 사용
            if (index === 0) {
              // 첫 번째 슬라이드: kinship
              imageSource = isDarkTheme
                ? require('@assets/webps/subscribe/kinship_dark.webp')
                : require('@assets/webps/subscribe/kinship_light.webp');
            } else if (index === 1) {
              // 두 번째 슬라이드: filter
              imageSource = isDarkTheme
                ? require('@assets/webps/subscribe/filter_dark.webp')
                : require('@assets/webps/subscribe/filter_light.webp');
            }
            
            return (
              <View
                key={slide.id}
                style={{ width }}
                className="flex-1 items-center justify-center overflow-hidden"
              >
                {/* 이미지/컴포넌트 영역 */}
                <View className="flex-1 w-full items-center justify-center mb-4">
                  {imageSource ? (
                    // 1, 2번째 슬라이드: 이미지 파일
                    <Image
                      source={imageSource}
                      className="w-full h-full"
                      resizeMode="contain"
                    />
                  ) : index >= 2 ? (
                    // 3, 4, 5번째 슬라이드: 코드로 작성한 컴포넌트
                    renderCustomSlideContent(index)
                  ) : null}
                </View>
                {/* 설명 영역 */}
                <View className="w-full items-center justify-start px-8">
                  <Text
                    text={t(slide.titleKey)}
                    type="title3"
                    style={{ color: colors.TEXT, marginBottom: 12, textAlign: 'center' }}
                  />
                  <Text
                    text={t(slide.descriptionKey)}
                    type="body2"
                    style={{ color: colors.TEXT_2, textAlign: 'center', lineHeight: 24 }}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
        {/* 페이지 인디케이터 */}
        <View className="flex-row items-center justify-center gap-2 py-2">
          {carouselSlides.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === currentPage ? 'bg-primary' : 'bg-black'
              }`}
              style={{
                width: index === currentPage ? 24 : 8,
                backgroundColor: index === currentPage ? colors.PRIMARY : colors.COMPONENT_BACKGROUND_2,
              }}
            />
          ))}
        </View>
      </View>

      {/* 플랜 / 구독 상태 */}
      {subscriptionInfo.isSubscribed ? (
        <View className="w-full px-8">
          <View
            className="p-4 rounded-2xl border"
            style={{
              borderColor: colors.PRIMARY,
              backgroundColor: colors.COMPONENT_BACKGROUND,
            }}
          >
            <Text
              text={t('subscriptionScreen.status.title')}
              type="title3"
              style={{ color: colors.TEXT, marginBottom: 8 }}
            />
            <View className="gap-4">
              <Text
                text={
                  subscriptionInfo.subscriptionExpiryDate
                    ? t('subscriptionScreen.status.nextBilling', {
                        date: formatExpiryDate(subscriptionInfo.subscriptionExpiryDate),
                      })
                    : t('subscriptionScreen.status.nextBillingUnknown')
                }
                type="body2"
                style={{ color: colors.TEXT_2 }}
              />
              {(() => {
                const currentProduct = getCurrentProduct();
                const isMonthly =
                  currentProduct &&
                  monthlyProduct &&
                  getProductId(currentProduct) === getProductId(monthlyProduct);
                const isYearly =
                  currentProduct &&
                  yearlyProduct &&
                  getProductId(currentProduct) === getProductId(yearlyProduct);
                const planName = isMonthly
                  ? t('subscriptionScreen.plan.monthly')
                  : isYearly
                  ? t('subscriptionScreen.plan.yearly')
                  : t('subscriptionScreen.status.planUnknown');
                const price = getProductPrice(currentProduct, !!isMonthly);

                return (
                  <>
                    <Text
                      text={t('subscriptionScreen.status.planName', { plan: planName })}
                      type="body2"
                      style={{ color: colors.TEXT_2 }}
                    />
                    <Text
                      text={
                        price
                          ? t('subscriptionScreen.status.price', { price })
                          : t('subscriptionScreen.plan.priceUnavailable')
                      }
                      type="body2"
                      style={{ color: colors.TEXT_2 }}
                    />
                  </>
                );
              })()}
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-row w-full h-1/5 gap-4 px-8">
          {/* monthly plan */}
          <TouchableOpacity
            className={`flex-1  border rounded-2xl ${
              selectedPlan === 'monthly' ? 'border-background bg-background' : 'border-border bg-component-background'
            }`}
            onPress={() => handlePlanSelect('monthly')}
            disabled={subscriptionInfo.isSubscribed || !monthlyProduct}
            style={{
              borderColor: selectedPlan === 'monthly' ? colors.PRIMARY : colors.BORDER,
              opacity: subscriptionInfo.isSubscribed || !monthlyProduct ? 0.5 : 1,
            }}
          >
            <View className="flex-1 p-4 items-start justify-between">
              <Text text={t('subscriptionScreen.plan.monthly')} type="title3" style={{ color: colors.TEXT, marginBottom: 8 }} />
              {(() => {
                const price = getProductPrice(monthlyProduct, true);
                return price ? (
                  <Text text={price} type="title3" style={{ color: colors.TEXT }} />
                ) : (
                  <Text text={t('subscriptionScreen.plan.priceUnavailable')} type="body2" style={{ color: colors.TEXT_2 }} />
                );
              })()}
            </View>
          </TouchableOpacity>
          {/* yearly plan */}
          <TouchableOpacity
            className={`flex-1 border rounded-2xl ${
              selectedPlan === 'yearly' ? 'border-background bg-background' : 'border-border bg-component-background'
            }`}
            onPress={() => handlePlanSelect('yearly')}
            disabled={subscriptionInfo.isSubscribed || !yearlyProduct}
            style={{
              borderColor: selectedPlan === 'yearly' ? colors.PRIMARY : colors.BORDER,
              opacity: subscriptionInfo.isSubscribed || !yearlyProduct ? 0.5 : 1,
            }}
          >
            <View className="flex-1 p-4 items-start justify-between">
              <View
                className="px-3 h-8 items-center justify-center border-2 border-text bg-background rounded-full"
                style={{ position: 'absolute', top: -18, right: 8 }}
              >
                <Text text={t('subscriptionScreen.plan.discountBadge')} type="body3" style={{ color: colors.TEXT, fontWeight: 800 }} />
              </View>
              <Text text={t('subscriptionScreen.plan.yearly')} type="title3" style={{ color: colors.TEXT, marginBottom: 8 }} />
              {(() => {
                const monthly = getMonthlyPriceFromYearly(yearlyProduct);
                return monthly ? (
                  <Text text={t('subscriptionScreen.plan.monthlyApprox', { price: monthly })} type="body3" style={{ color: colors.TEXT_2 }} />
                ) : null;
              })()}
              {(() => {
                const price = getProductPrice(yearlyProduct, false);
                return price ? (
                  <Text text={price} type="title3" style={{ color: colors.TEXT }} />
                ) : (
                  <Text text={t('subscriptionScreen.plan.priceUnavailable')} type="body2" style={{ color: colors.TEXT_2 }} />
                );
              })()}
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* 구독 버튼 (구독 중이면 숨김) */}
      {!subscriptionInfo.isSubscribed && (
        <View className="w-full h-20 px-8 py-2">
          <TouchableOpacity 
          className="bg-background rounded-full w-full h-full items-center justify-center"
          style={{
            boxShadow:[
              {
                offsetX: 0,
                offsetY: 0,
                blurRadius: 7,
                spreadDistance: 0,
                color: 'rgba(255, 57, 0, 1)',
              },
            ],
            opacity: (!selectedPlan || purchasing) ? 0.5 : 1,
          }}
          onPress={handleSubscribe}
          disabled={!selectedPlan || purchasing}
          >  
            {purchasing ? (
              <ActivityIndicator size="small" color={colors.TEXT} />
            ) : (
              <Text
                text={
                  selectedPlan === 'monthly'
                    ? t('subscriptionScreen.cta.monthly')
                    : selectedPlan === 'yearly'
                    ? t('subscriptionScreen.cta.yearly')
                    : t('subscriptionScreen.cta.default')
                }
                type="body1"
                className="text-text"
              />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 개인정보 처리방침 , 약관 */}
      <View className="flex-row items-center justify-between w-full h-10 px-8">
        <View className="flex-row items-center justify-start flex-1 gap-2">
          <TouchableOpacity
            className=" items-center justify-center"
            onPress={() => handleOpenPolicy(PRIVACY_POLICY_URL, t('subscriptionScreen.policy.privacyTitle'))}
          >
            <Text text={t('subscriptionScreen.policy.privacy')} type="caption1" className="text-text-2" />
          </TouchableOpacity>
          <Text text="|" type="caption1" className="text-text-2" />
          <TouchableOpacity
            className=" items-center justify-center"
            onPress={() => handleOpenPolicy(TERMS_OF_SERVICE_URL, t('subscriptionScreen.policy.termsTitle'))}
          >
            <Text text={t('subscriptionScreen.policy.terms')} type="caption1" className="text-text-2" />
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center justify-end">
        <Text text={t('subscriptionScreen.policy.cancelAnytime')} type="caption1" className="text-text-2" />
        </View>
      </View>
      </View>
    </Background>
  );
};
