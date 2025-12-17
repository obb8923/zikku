import { View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@nav/stack/MoreStack';
import { Background } from '@components/Background';
import { Text } from '@components/Text';

type MoreScreenNavigationProp = NativeStackNavigationProp<MoreStackParamList, 'More'>;

export const MoreScreen = () => {
  const navigation = useNavigation<MoreScreenNavigationProp>();

  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  return (
    <Background type="white" isStatusBarGap>
      <View className="flex-1 px-6 py-8">
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