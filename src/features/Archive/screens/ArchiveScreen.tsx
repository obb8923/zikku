import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Background } from '@components/Background';
import { Text } from '@components/Text';
import { BackButton } from '@components/BackButton';

export const ArchiveScreen = () => {
  const navigation = useNavigation();

  return (
    <Background type="white" isStatusBarGap>
      <View className="flex-1">
      <BackButton onPress={() => navigation.goBack()} />
      <View className="flex-1 px-6 py-8">
       
        <Text type="title1" text="아카이브" />
      </View>
      </View>
    </Background>
  );
}