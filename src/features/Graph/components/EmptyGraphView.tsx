import { View } from 'react-native';
import { Text } from '@components/Text';
import { useTranslation } from 'react-i18next';

export const EmptyGraphView = () => {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center">
      <View className="items-center justify-center">
        <Text text={t('graph.empty.title')} type="title4" className="text-text" />
        <Text text={t('graph.empty.line1')} type="title4" className="text-text" />
        <Text text={t('graph.empty.line2')} type="title4" className="text-text" />
      </View>
    </View>
  );
};


