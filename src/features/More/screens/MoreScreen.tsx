import { View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@nav/stack/MoreStack';
import { Background } from '@components/Background';
import { Text } from '@components/Text';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import ChevronLeft from '@assets/svgs/ChevronLeft.svg';
import {AuthButton} from '@/features/Auth/components/AuthButton';
type MoreScreenNavigationProp = NativeStackNavigationProp<MoreStackParamList, 'More'>;

export const MoreScreen = () => {
  const navigation = useNavigation<MoreScreenNavigationProp>();

  const handleLoginPress = () => {
    navigation.navigate('Auth');
  };

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
        <AuthButton onPress={handleLoginPress} />
        <Text type="title1" text="더보기" />
      </View>
      </View>
    </Background>
  );
};