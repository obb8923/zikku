import { View, Platform, Alert, Linking } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import type { MapStackParamList } from '@nav/stack/MapStack';
import { Background, LiquidGlassButton, Text, CategorySelectModal } from '@components/index';
import { MoreListItem, type MoreItem } from '../components/MoreListItem';
import { AuthButton } from '@features/More/components/AuthButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@stores/authStore';
import { COLORS } from '@constants/COLORS';
import type { ChipTypeKey } from '@constants/CHIP';
import XIcon from '@assets/svgs/X.svg';
import Share from 'react-native-share';
import { requestReview } from 'react-native-store-review';

type MoreScreenNavigationProp = NativeStackNavigationProp<MapStackParamList, 'More'>;

type MoreGroup = {
  id: string;
  title: string;
  items: MoreItem[];
};



export const MoreScreen = () => {
  const navigation = useNavigation<MoreScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const handleAppleLogin = useAuthStore((s) => s.handleAppleLogin);
  const handleGoogleLogin = useAuthStore((s) => s.handleGoogleLogin);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  // 각 버튼 핸들러 함수들
  const handlePersonalInfo = () => {
    navigation.navigate('MyInfo');
  };

  const handleLanguage = () => {
    Alert.alert('언어 설정', '언어 설정 기능은 준비 중입니다.');
  };

  const handleNotification = () => {
    Alert.alert('알림 설정', '알림 설정 기능은 준비 중입니다.');
  };

  const handleHaptic = () => {
    Alert.alert('햅틱 설정', '햅틱 설정 기능은 준비 중입니다.');
  };

  const handleCategory = () => {
    setIsCategoryModalVisible(true);
  };

  const handleCategorySelect = (category: ChipTypeKey) => {
    // 카테고리 선택 시 처리 로직 (필요에 따라 수정)
  };

  const handleCategoryModalClose = () => {
    setIsCategoryModalVisible(false);
  };

  const handleSuggest = () => {
    navigation.navigate('WebView', {
      url: 'https://forms.gle/PEWBnSqrHQc6mvQP8',
      title: '건의하기',
    });
  };

  const handleContact = () => {
    const email = 'contact@zikku.app'; // 실제 이메일 주소로 변경 필요
    const subject = encodeURIComponent('문의하기');
    const url = `mailto:${email}?subject=${subject}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('오류', '이메일 앱을 열 수 없습니다.');
    });
  };

  const handleRate = () => {
    try {
      requestReview();
      // 스토어 리뷰 요청 (void 반환)
      // 실패 시 스토어 링크로 이동
      const storeUrl = Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/idYOUR_APP_ID' // 실제 App Store ID로 변경 필요
        : 'https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME'; // 실제 패키지 이름으로 변경 필요
      // 리뷰 요청 후 잠시 대기 후 스토어 링크 열기 (선택적)
      setTimeout(() => {
        Linking.openURL(storeUrl).catch(() => {
          // 스토어 링크 열기 실패는 무시
        });
      }, 1000);
    } catch (error) {
      // 리뷰 요청 실패 시 스토어 링크로 직접 이동
      const storeUrl = Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/idYOUR_APP_ID' // 실제 App Store ID로 변경 필요
        : 'https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME'; // 실제 패키지 이름으로 변경 필요
      Linking.openURL(storeUrl).catch(() => {
        Alert.alert('오류', '스토어를 열 수 없습니다.');
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.open({
        message: '지쿠(Zikku) 앱을 추천합니다!',
        url: Platform.OS === 'ios'
          ? 'https://apps.apple.com/app/idYOUR_APP_ID' // 실제 App Store URL로 변경 필요
          : 'https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME', // 실제 Play Store URL로 변경 필요
      });
    } catch (error) {
      // 사용자가 공유를 취소한 경우는 에러로 처리하지 않음
    }
  };

  const handleTerms = () => {
    const url = 'https://zikku.app/terms'; // 실제 이용약관 URL로 변경 필요
    Linking.openURL(url).catch(() => {
      Alert.alert('오류', '링크를 열 수 없습니다.');
    });
  };

  const handlePrivacy = () => {
    const url = 'https://zikku.app/privacy'; // 실제 개인정보 처리방침 URL로 변경 필요
    Linking.openURL(url).catch(() => {
      Alert.alert('오류', '링크를 열 수 없습니다.');
    });
  };

  const handleItemPress = (item: MoreItem) => {
    item.handler();
  };

  // MOCK_MORE_GROUPS: 각 아이템에 id, title, handler 함수 포함
  const MOCK_MORE_GROUPS: MoreGroup[] = [
    {
      id: 'personalization',
      title: '개인화',
      items: [
        {
          id: 'personal-info',
          title: '내 정보',
          handler: handlePersonalInfo,
        },
        // {
        //   id: 'language',
        //   title: '언어',
        //   handler: handleLanguage,
        // },
        // {
        //   id: 'notification',
        //   title: '알림',
        //   handler: handleNotification,
        // },
        // {
        //   id: 'haptic',
        //   title: '햅틱',
        //   handler: handleHaptic,
        // },
        {
          id: 'type',
          title: '카테고리',
          handler: handleCategory,
        },
      ],
    },
    {
      id: 'about',
      title: '소개',
      items: [
        {
          id: 'suggest',
          title: '건의하기',
          handler: handleSuggest,
        },
        {
          id: 'contact',
          title: '문의하기',
          handler: handleContact,
        },
        // {
        //   id: 'rate',
        //   title: '저희를 응원해주세요!',
        //   handler: handleRate,
        // },
        // {
        //   id: 'share',
        //   title: '공유하기',
        //   handler: handleShare,
        // },
        // {
        //   id: 'terms',
        //   title: '이용약관',
        //   handler: handleTerms,
        // },
        // {
        //   id: 'privacy',
        //   title: '개인정보 처리방침',
        //   handler: handlePrivacy,
        // },
      ],
    },
  ];

  const renderItem: ListRenderItem<MoreGroup> = ({ item }) => {
    return (
      <View className="mb-6">
        {/* 그룹 헤더 */}
        <View className="mb-3 px-2">
          <Text
            type="body1"
            text={item.title}
            className="font-semibold text-text-2"
          />
        </View>
        
        {/* 그룹 아이템들 */}
        <View className="bg-component-background rounded-3xl px-4">
          {item.items.map((moreItem, index) => (
            <MoreListItem
              key={moreItem.id}
              item={moreItem}
              onPress={handleItemPress}
              isLast={index === item.items.length - 1}
            />
          ))}
        </View>
      </View>
    );
  };

  const handleLoginPress = async () => {
    if(Platform.OS === 'ios') {
      await handleAppleLogin();
    } else {
      await handleGoogleLogin();
    }
  };



  return (
    <Background isStatusBarGap={false} style={{ paddingBottom: 0 }}>
      <View className="pt-4 px-6 mb-4 flex-row justify-between items-center">
          <Text type="title3" text="더보기" style={{ fontWeight: '600', color: COLORS.TEXT_2 }} />
          <LiquidGlassButton size="small" onPress={() => navigation.goBack()}>
            <XIcon width={20} height={20} color={COLORS.TEXT} />
          </LiquidGlassButton>
      </View>
        <View className="flex-1 px-6">
          <FlashList
            data={MOCK_MORE_GROUPS}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingVertical: 16,
              paddingBottom: insets.bottom + 16,
            }}
            ListHeaderComponent={() => (
              <View className="mb-6 gap-6">
                {/* Auth Section */}
                {!isLoggedIn && (
                  <View className="w-full items-center justify-center">
                    <AuthButton onPress={handleLoginPress} />
                  </View>
                )}
              </View>
            )}
          />
        </View>
        <CategorySelectModal
          visible={isCategoryModalVisible}
          onClose={handleCategoryModalClose}
          onSelect={handleCategorySelect}
        />
    </Background>
  );
};