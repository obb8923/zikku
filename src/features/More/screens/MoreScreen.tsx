import { View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@nav/stack/MoreStack';
import { Background } from '@components/Background';
import { Text } from '@components/Text';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import ChevronLeft from '@assets/svgs/ChevronLeft.svg';

type MoreScreenNavigationProp = NativeStackNavigationProp<MoreStackParamList, 'More'>;

export const MoreScreen = () => {
  const navigation = useNavigation<MoreScreenNavigationProp>();

  const handleLoginPress = () => {
    navigation.navigate('Auth');
  };

  return (
    <Background type="white" isStatusBarGap>
      <View className="flex-1 px-6 py-8">
        <View className="absolute top-12 left-4 z-10">
          <LiquidGlassButton
            onPress={() => navigation.goBack()}
            size="medium"
          >
            <ChevronLeft width={20} height={20} color="black" />
          </LiquidGlassButton>
        </View>
        <Text type="title1" text="설정" className="mb-8" />
        
        <TouchableOpacity
          onPress={handleLoginPress}
          className="bg-blue-500 rounded-lg py-4 px-6 items-center"
          activeOpacity={0.8}
        >
          <Text type="body1" text="로그인" className="text-white" />
        </TouchableOpacity>
      </View>
    </Background>
  );
};