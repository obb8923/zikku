import { View } from 'react-native';
import { Background } from '@components/Background';
import { Text } from '@components/Text';

export const ArchiveScreen = () => {
  return (
    <Background type="white" isStatusBarGap>
      <View className="flex-1 px-6 py-8">
        <Text type="title1" text="아카이브" />
      </View>
    </Background>
  );
}