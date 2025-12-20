import { View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@nav/stack/MoreStack';
import { Background } from '@components/Background';
import { Text } from '@components/Text';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import ChevronLeft from '@assets/svgs/ChevronLeft.svg';
import { BUTTON_SIZE_MEDIUM } from '@/shared/constants/NORMAL';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/shared/stores/authStore';
import { useEffect, useState } from 'react';
import { getUserProfile, type UserProfile } from '@/shared/libs/supabase/userProfileService';

type MyInfoScreenNavigationProp = NativeStackNavigationProp<MoreStackParamList, 'MyInfo'>;

export const MyInfoScreen = () => {
  const navigation = useNavigation<MyInfoScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.userId);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const profile = await getUserProfile();
      setUserProfile(profile);
      setIsLoading(false);
    };

    void fetchUserProfile();
  }, [userId]);

  return (
    <Background type="white" isStatusBarGap>
      <View className="flex-1">
        <View className="absolute top-0 left-4 z-10">
          <LiquidGlassButton onPress={() => navigation.goBack()}>
            <ChevronLeft width={24} height={24} color="black" />
          </LiquidGlassButton>
        </View>
        <ScrollView
          className="flex-1 px-8"
          contentContainerStyle={{
            paddingTop: BUTTON_SIZE_MEDIUM + 24,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <View className="w-full items-center justify-center gap-6">
            <Text type="title1" text="내 정보" />
            
            {isLoading ? (
              <Text type="body1" text="로딩 중..." />
            ) : userProfile ? (
              <View className="w-full gap-4">
                {userProfile.avatar_url && (
                  <View className="w-full items-center">
                    <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
                      {/* 아바타 이미지가 있다면 여기에 표시 */}
                      <Text type="title2" text={userProfile.name?.charAt(0).toUpperCase() || 'U'} />
                    </View>
                  </View>
                )}
                
                <View className="w-full gap-2">
                  <Text type="body2" text="이름" className="text-gray-600" />
                  <View className="w-full p-4 rounded-lg bg-gray-50">
                    <Text type="body1" text={userProfile.name || '이름 없음'} />
                  </View>
                </View>

                <View className="w-full gap-2">
                  <Text type="body2" text="이메일" className="text-gray-600" />
                  <View className="w-full p-4 rounded-lg bg-gray-50">
                    <Text type="body1" text={userProfile.email || '이메일 없음'} />
                  </View>
                </View>

                {userProfile.code && (
                  <View className="w-full gap-2">
                    <Text type="body2" text="사용자 코드" className="text-gray-600" />
                    <View className="w-full p-4 rounded-lg bg-gray-50">
                      <Text type="body1" text={userProfile.code} />
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <Text type="body1" text="사용자 정보를 불러올 수 없습니다." />
            )}
          </View>
        </ScrollView>
      </View>
    </Background>
  );
};

