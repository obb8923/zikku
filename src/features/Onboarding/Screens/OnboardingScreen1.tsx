import { View, Image } from 'react-native';
import { Background, Text, Button } from '@components/index';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@nav/stack/OnboardingStack';
import { useTranslation } from 'react-i18next';
import Onboarding1Icon from '@assets/svgs/Onboarding1.svg';
import { useColors } from '@shared/hooks/useColors';
type OnboardingScreen1NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Onboarding1'>;

export const OnboardingScreen1 = () => {
  const navigation = useNavigation<OnboardingScreen1NavigationProp>();
  const { t } = useTranslation();
  const colors = useColors();
  const handleNext = () => {
    navigation.navigate('Onboarding2');
  };

  return (
    <Background isTabBarGap={true}>
      <View className="flex-1 items-center justify-between">
        {/* 컨텐츠 영역 */}
        <View className="items-center justify-start flex-1 pt-20 px-8">
            <View className="items-center justify-center items-center gap-4 mb-16">
                <Text text={t('onboarding.screen1.title1')} type="title1" className="text-center text-text"/>
                <Text text={t('onboarding.screen1.title2')} type="title1" className="text-center text-text"/>
                <Text text={t('onboarding.screen1.description')} type="body1" className="text-text-2 text-center" />
            </View>
            <View className="items-center justify-center w-5/6 aspect-square">
            <Onboarding1Icon width='100%' height='100%' color={colors.TEXT} />
            </View>
        </View>
        {/* 버튼 영역*/}
        <View className="items-center justify-center w-full px-8">
        <Button text={t('onboarding.screen1.next')} onPress={handleNext} style={{ width: '100%' }} />
        </View>
      </View>
    </Background>
  );
};

