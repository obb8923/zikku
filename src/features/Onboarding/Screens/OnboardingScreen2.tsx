import { View, TouchableOpacity, Image } from 'react-native';
import { Background, Text, Button } from '@components/index';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@nav/stack/OnboardingStack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ChevronLeft from '@assets/svgs/ChevronLeft.svg';
import { useColors } from '@shared/hooks/useColors';
import {useThemeStore, CurrentTheme} from '@stores/themeStore';
type OnboardingScreen2NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Onboarding2'>;

export const OnboardingScreen2 = () => {
  const navigation = useNavigation<OnboardingScreen2NavigationProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useColors();
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const handleNext = () => {
    navigation.navigate('Onboarding3');
  };

  const handleBack = () => {
    navigation.goBack();
  };
  
  const isDarkTheme = currentTheme === 'dark';
  const imageSource = isDarkTheme ? require('@assets/webps/onboarding2_dark.webp') : require('@assets/webps/onboarding2_light.webp');
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
                <Text text={t('onboarding.screen2.title')} type="title1" className="text-center text-text"/>
                <Text text={t('onboarding.screen2.description')} type="body1" className="text-text-2 text-center" />
            </View>
            <View className="items-center justify-center w-5/6 aspect-square">
            <Image
                source={imageSource}
                className="w-full h-full"
                resizeMode="contain"
            />
            </View>
        </View>
        {/* 버튼 영역*/}
        <View className="items-center justify-center w-full px-8">
        <Button text={t('onboarding.screen2.next')} onPress={handleNext} style={{ width: '100%' }} />
        </View>
   
    </Background>
    
  );
};

