import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Background, AppBar } from '@components/index';

const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdd4lRNOsMcVU5Ts3VyH5bj4yhqKuRkKqsmUD3Ktal9JbFk7Q/viewform?usp=publish-editor';

export const FeedbackWebViewScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <Background isStatusBarGap={true}>
      <AppBar 
        title={t('setting.feedback.title')} 
        onLeftPress={handleGoBack}
      />
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: FEEDBACK_FORM_URL }}
          style={{ flex: 1 }}
          startInLoadingState={true}
          scalesPageToFit={true}
        />
      </View>
    </Background>
  );
};