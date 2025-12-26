import { View, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import type { MapStackParamList } from '@nav/stack/MapStack';
import { Background, LiquidGlassButton, Text } from '@components/index';
import { MoreListItem, type MoreItem } from '../components/MoreListItem';
import { AuthButton } from '@/features/More/componentes/AuthButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/shared/stores/authStore';
import { COLORS } from '@constants/COLORS';
import XIcon from '@assets/svgs/X.svg';

type MoreScreenNavigationProp = NativeStackNavigationProp<MapStackParamList, 'More'>;

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
      },
      {
        id: 'notification',
        title: '알림',
      },
      {
        id: 'haptic',
        title: '햅틱',
      },
      {
        id: 'type',
        title: '카테고리',
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
      },
      {
        id: 'contact',
        title: '문의하기',
      },
      {
        id: 'rate',
        title: '저희를 응원해주세요!',
      },
      {
        id: 'share',
        title: '공유하기',
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



export const MoreScreen = () => {
  const navigation = useNavigation<MoreScreenNavigationProp>();
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
    <Background isStatusBarGap={false}>
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
    </Background>
  );
};