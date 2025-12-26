import { View, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import type { MoreStackParamList } from '@nav/stack/MoreStack';
import { Background } from '@components/Background';
import { Text } from '@components/Text';
import { BackButton } from '@components/BackButton';
import { LiquidGlassView } from '@components/LiquidGlassView';
import {AuthButton} from '@/features/More/componentes/AuthButton';
import {BUTTON_SIZE_MEDIUM} from '@/shared/constants/NORMAL';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { useAuthStore } from '@/shared/stores/authStore';
import { TAB_NAME } from '@constants/TAB_NAV_OPTIONS';
import { COLORS } from '@constants/COLORS';

type MoreItem = {
  id: string;
  title: string;
  description?: string;
};

type MoreGroup = {
  id: string;
  title: string;
  items: MoreItem[];
};

const MOCK_MORE_GROUPS: MoreGroup[] = [
  {
    id: 'personalization',
    title: '개인화',
    items: [
      {
        id: 'personal-info',
        title: '내 정보',
      },
      {
        id: 'language',
        title: '언어',
        description: '앱에서 사용할 언어를 선택해요',
      },
      {
        id: 'notification',
        title: '알림',
        description: '푸시 알림을 관리해요',
      },
      {
        id: 'haptic',
        title: '햅틱',
        description: '진동/햅틱 피드백을 설정해요',
      },
      {
        id: 'type',
        title: '카테고리',
        description: '지도/테마 카테고리를 선택해요',
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
        description: '원하는 기능이나 개선점을 보내주세요',
      },
      {
        id: 'contact',
        title: '문의하기',
        description: '궁금한 점을 개발자에게 물어봐요',
      },
      {
        id: 'rate',
        title: '저희를 응원해주세요! (평점 남기기)',
      },
      {
        id: 'share',
        title: '공유하기',
        description: '지쿠를 주변 사람들과 나눠요',
      },
    ],
  },
  {
    id: 'policy',
    title: '약관 및 정책',
    items: [
      {
        id: 'terms',
        title: '이용약관',
      },
      {
        id: 'privacy',
        title: '개인정보 처리방침',
      },
    ],
  },
];

type MoreListItemProps = {
  item: MoreItem;
  onPress?: (item: MoreItem) => void;
  isLast?: boolean;
};

const MoreListItem = ({ item, onPress, isLast }: MoreListItemProps) => {
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        className="w-full py-4"
        onPress={() => onPress?.(item)}
      >
        <View className="w-full">
          <Text
            type="body1"
            text={item.title}
            style={{ fontWeight: '600', color: COLORS.TEXT_COMPONENT }}
          />
          {item.description && (
            <Text
              type="body2"
              text={item.description}
              style={{ marginTop: 4, color: COLORS.TEXT_2 }}
            />
          )}
        </View>
      </TouchableOpacity>
      {!isLast && (
        <View
          style={{
            height: 1,
            backgroundColor: COLORS.TEXT_2,
            opacity: 0.1,
            marginLeft: 0,
          }}
        />
      )}
    </>
  );
};

type MoreScreenNavigationProp = NativeStackNavigationProp<MoreStackParamList, 'More'>;

export const MoreScreen = () => {
  const stackNavigation = useNavigation<MoreScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const handleAppleLogin = useAuthStore((s) => s.handleAppleLogin);
  const handleGoogleLogin = useAuthStore((s) => s.handleGoogleLogin);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const handleItemPress = (item: MoreItem) => {
    // TODO: 실제 네비게이션/액션 연결
    // console.log('More item pressed:', item);
  };

  const renderItem: ListRenderItem<MoreGroup> = ({ item }) => {
    return (
      <View className="mb-6">
        {/* 그룹 헤더 */}
        <View className="mb-3 px-2">
          <Text
            type="title3"
            text={item.title}
            style={{ fontWeight: '600', color: COLORS.TEXT_2 }}
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

  const handleBackPress = () => {
  };

  return (
    <Background type="white" isStatusBarGap>
      <View className="flex-1">
        <BackButton onPress={handleBackPress} />
        <View className="flex-1 px-8">
          <FlashList
            data={MOCK_MORE_GROUPS}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingTop: BUTTON_SIZE_MEDIUM + 24,
              paddingBottom: insets.bottom + 24,
            }}
            ListHeaderComponent={() => (
              <View className="mb-6 gap-6">
                {/* Auth Section */}
                {!isLoggedIn && (
                  <View className="w-full items-center justify-center">
                    <AuthButton onPress={handleLoginPress} />
                  </View>
                )}
                {/* MYINFO Section */}
                {isLoggedIn && (
                  <View className="w-full items-center justify-center gap-4">
                    <Text type="title1" text="MYINFO" />
                    <TouchableOpacity
                      onPress={() => stackNavigation.navigate('MyInfo')}
                      className="w-full"
                      activeOpacity={0.8}
                    >
                      <LiquidGlassView
                        borderRadius={12}
                        className="w-full"
                        innerStyle={{
                          paddingVertical: 16,
                          paddingHorizontal: 16,
                        }}
                      >
                        <View className="w-full items-center">
                          <Text type="body1" text="내 정보 보기" />
                        </View>
                      </LiquidGlassView>
                    </TouchableOpacity>
                  </View>
                )}
                <Text
                  type="title3"
                  text="더보기"
                  style={{ fontWeight: '600', color: COLORS.TEXT_2 }}
                />
              </View>
            )}
          />
        </View>
      </View>
    </Background>
  );
};