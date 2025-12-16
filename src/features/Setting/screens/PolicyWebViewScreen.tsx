import { View, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Background, AppBar } from '@components/index';
import type { SettingStackParamList } from '@nav/stack/SettingStack';

type PolicyWebViewRouteProp = RouteProp<SettingStackParamList, 'PolicyWebView'>;

export const PolicyWebViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<PolicyWebViewRouteProp>();
  const { title, url } = route.params;

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (!url) {
    Alert.alert('준비 중', '문서 URL이 설정되지 않았습니다.');
    navigation.goBack();
    return null;
  }

  return (
    <Background isStatusBarGap={true}>
      <AppBar title="" onLeftPress={handleGoBack} />
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: url }}
          style={{ flex: 1 }}
          startInLoadingState={true}
          scalesPageToFit={true}
        />
      </View>
    </Background>
  );
};
