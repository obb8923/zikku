import { View, TouchableOpacity } from 'react-native';
import { Background, Text, Button } from '@components/index';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@nav/stack/OnboardingStack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ChevronLeft from '@assets/svgs/ChevronLeft.svg';
import { useColors } from '@shared/hooks/useColors';
import { useOnboardingStore } from '@stores/onboardingStore';
import { useSetActiveTab } from '@stores/tabStore';
import { TAB_NAME } from '@constants/TAB_NAV_OPTIONS';
import { logEvent } from '@services/analytics';

type OnboardingScreen3NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Onboarding3'>;

export const OnboardingScreen3 = () => {
  const navigation = useNavigation<OnboardingScreen3NavigationProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useColors();
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const setActiveTab = useSetActiveTab();
  
  const handleNext = async () => {
    // 온보딩 완료 처리 및 People 탭으로 이동
    logEvent('onboarding_complete', { method: 'button' });
    setActiveTab(TAB_NAME.PEOPLE);
    await completeOnboarding();
    // RootStack이 AppTab으로 전환되면서 People 탭이 활성화된 상태로 PeopleScreen이 표시됨
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <Background isTabBarGap={true}>
      <TouchableOpacity
        className="absolute z-10 w-10 h-10 rounded-full justify-center items-center"
        style={{
          top: insets.top + 16,
          left: 16,
        }}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <ChevronLeft width={24} height={24} color={colors.BLACK} />
      </TouchableOpacity>
      {/* 컨텐츠 영역 */}
      <View className="items-center justify-start flex-1 pt-20 px-8">
            <View className="items-center justify-center items-center gap-4 mb-16">
                <Text text={t('onboarding.screen3.title')} type="title1" className="mb-8 text-center text-text" />
                <Text text={t('onboarding.screen3.line1')} type="body1" className="text-text-2 mb-2 text-center" />
                <Text text={t('onboarding.screen3.line2')} type="body1" className="text-text-2 text-center" />
            </View>
            <View className="items-center justify-center w-2/3 aspect-square">
            {/* <Image
                source={require('@assets/webps/onboarding3.webp')}
                className="w-full h-full"
                resizeMode="contain"
            /> */}
            </View>
        </View>
        {/* 버튼 영역*/}
        <View className="items-center justify-center w-full px-8">
        <Button text={t('onboarding.screen3.start')} onPress={handleNext} style={{ width: '100%' }} />
        </View>
        
    
    </Background>
  );
};

