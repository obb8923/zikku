import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Background } from '@components/Background';
import { Text } from '@components/Text';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import ChevronLeft from '@assets/svgs/ChevronLeft.svg';

export const ArchiveScreen = () => {
  const navigation = useNavigation();

  return (
    <Background type="white" isStatusBarGap>
      <View className="flex-1">
      <View className="absolute top-0 left-4">
      <LiquidGlassButton
            onPress={() => navigation.goBack()}
            size="medium"
          >
            <ChevronLeft width={20} height={20} color="black" />
          </LiquidGlassButton>
          </View>
      <View className="flex-1 px-6 py-8">
       
        <Text type="title1" text="아카이브" />
      </View>
      </View>
    </Background>
  );
}