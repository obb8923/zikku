import { View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MoreStackParamList } from '@nav/stack/MoreStack';
import type { AppTabParamList } from '@nav/tab/AppTab';
import { Background } from '@components/Background';
import { Text } from '@components/Text';
import { BackButton } from '@components/BackButton';
import { LiquidGlassView } from '@components/LiquidGlassView';
import {AuthButton} from '@/features/More/componentes/AuthButton';
import {BUTTON_SIZE_MEDIUM} from '@/shared/constants/NORMAL';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { useAuthStore } from '@/shared/stores/authStore';
import { TAB_NAME } from '@constants/TAB_NAV_OPTIONS';

type MoreScreenNavigationProp = NativeStackNavigationProp<MoreStackParamList, 'More'>;
type TabNavigationProp = BottomTabNavigationProp<AppTabParamList>;

export const MoreScreen = () => {
  const stackNavigation = useNavigation<MoreScreenNavigationProp>();
  const tabNavigation = useNavigation<TabNavigationProp>();
  const insets = useSafeAreaInsets();
  const handleAppleLogin = useAuthStore((s) => s.handleAppleLogin);
  const handleGoogleLogin = useAuthStore((s) => s.handleGoogleLogin);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const handleLoginPress = async () => {
    if(Platform.OS === 'ios') {
      await handleAppleLogin();
    } else {
      await handleGoogleLogin();
    }
  };

  const handleBackPress = () => {
    tabNavigation.navigate(TAB_NAME.MAP);
  };

  return (
    <Background type="white" isStatusBarGap>
        <View className="flex-1">
      <BackButton onPress={handleBackPress} />
      <ScrollView 
      className="flex-1 px-8"
      contentContainerStyle={{paddingTop:BUTTON_SIZE_MEDIUM+24,paddingBottom:insets.bottom+24}}
      >
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
        <Text type="title1" text="더보기" />
      </ScrollView>
      </View>
    </Background>
  );
};