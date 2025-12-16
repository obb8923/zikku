import { use, useEffect, useState } from 'react';
import { View, Alert, TouchableOpacity, Platform, Linking, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors } from '@shared/hooks/useColors';

import { Background, ScreenHeader, TabBar, Text } from '@components/index';
import {
  SupportedLanguage,
  changeLanguage,
  loadSavedLanguage,
  supportedLanguages,
} from '@i18n/index';
import { useThemeStore, ThemeMode } from '@stores/themeStore';
import { AdmobNative } from "@components/ads/AdmobNative";
import type { SettingStackParamList } from '@nav/stack/SettingStack';
import { usePendingSubscriptionNav, useSetPendingSubscriptionNav } from '@stores/tabStore';
import { logEvent, platformLabel } from '@services/analytics';

const normalizeLanguage = (language?: string | null): SupportedLanguage => {
  if (language && supportedLanguages.includes(language as SupportedLanguage)) {
    return language as SupportedLanguage;
  }
  return 'en';
};

type SettingScreenNavigationProp = NativeStackNavigationProp<SettingStackParamList, 'Setting'>;

export const SettingScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<SettingScreenNavigationProp>();
  const pendingSubscriptionNav = usePendingSubscriptionNav();
  const setPendingSubscriptionNav = useSetPendingSubscriptionNav();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(() =>
    normalizeLanguage(i18n.language),
  );
  const [isLoading, setIsLoading] = useState(true);
  const themeMode = useThemeStore((state) => state.themeMode);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const colors = useColors();
  useEffect(() => {
    let isMounted = true;
    const syncLanguage = async () => {
      const savedLanguage = await loadSavedLanguage();
      if (!isMounted) return;
      const normalized = normalizeLanguage(savedLanguage);
      setSelectedLanguage(normalized);
      setIsLoading(false);
    };
    syncLanguage();
    return () => {
      isMounted = false;
    };
  }, []);

  // 다른 탭에서 구독 이동 요청 처리
  useEffect(() => {
    if (pendingSubscriptionNav) {
      navigation.navigate('Subscription');
      setPendingSubscriptionNav(false);
    }
  }, [pendingSubscriptionNav, navigation, setPendingSubscriptionNav]);

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    if (code === selectedLanguage || isLoading) return;
    await changeLanguage(code);
    Alert.alert(t('setting.language.alert'));
    setSelectedLanguage(code);
    logEvent('setting_language_change', { code });
  };

  const handleSelectTheme = async (mode: ThemeMode) => {
    if (mode === themeMode) return;
    await setThemeMode(mode);
    Alert.alert(t('setting.theme.alert'));
    logEvent('setting_theme_change', { mode });
  };

  const handleOpenFeedback = () => {
    logEvent('setting_feedback_open', {});
    navigation.navigate('FeedbackWebView');
  };

  const handleOpenSubscription = () => {
    navigation.navigate('Subscription');
  };

  const handleRateApp = async () => {
    const appStoreLink = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/id6755381285'
      : 'https://play.google.com/store/apps/details?id=com.jeong.linknote';
    
    try {
      const canOpen = await Linking.canOpenURL(appStoreLink);
      if (canOpen) {
        await Linking.openURL(appStoreLink);
      } else {
        Alert.alert(t('setting.rateApp.error'), t('setting.rateApp.errorMessage'));
      }
      logEvent('app_rate_open', { platform: platformLabel });
    } catch (error) {
      console.error('앱스토어 링크 열기 실패:', error);
      Alert.alert(t('setting.rateApp.error'), t('setting.rateApp.errorMessage'));
    }
  };

  const themeModes: ThemeMode[] = ['system', 'dark', 'light'];

  return (
    <Background isTabBarGap={true}>
      <ScreenHeader title={t('setting.title')} />
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
          {/* 구독 관리 */}
          <View className="mt-4 w-full h-20 px-6 py-2 flex-row gap-4 items-center justify-between">
        <TouchableOpacity 
        className="bg-background rounded-full w-full h-full items-center justify-center"
        style={{
          boxShadow:[
            {
              offsetX: 0,
              offsetY: 0,
              blurRadius: 7,
              spreadDistance: 0,
              color: 'rgba(255, 57, 0, 1)',
            },
          ],
        }}
        onPress={handleOpenSubscription}
        >  
         <Text
                text={t('setting.subscription.manage')}
                type="body1"
                style={{ color: colors.TEXT, fontWeight: '700' }}
              />
        </TouchableOpacity>
          </View>
          {/* 언어 선택 */}
          <View className="w-full h-20 px-6 py-2 flex-row gap-4 items-center justify-between">
            <Text text={t('setting.language.sectionTitle')} type="title4" className="text-text" />
            <View className="flex-1 flex-row gap-2 items-center justify-end">
              {supportedLanguages.map((languageCode) => {
                const isSelected = languageCode === selectedLanguage;
                const labelKey = languageCode === 'ko' ? '한국어' : 'English';
                return (
                  <TouchableOpacity
                    key={languageCode}
                    className={`flex-row items-center justify-center rounded-full px-4 py-1 ${isSelected ? 'bg-component-background-2' : 'bg-component-background'
                      }`}
                    onPress={() => handleSelectLanguage(languageCode)}
                    disabled={isLoading}
                  >
                    <Text 
                    text={labelKey} 
                    type="body1" 
                    style={{ color: isSelected ? colors.TEXT : colors.TEXT_2}} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {/* 테마 선택 */}
          <View className="w-full h-20 px-6 py-2 flex-row gap-4 items-center justify-between">
            <Text text={t('setting.theme.sectionTitle')} type="title4" className="text-text" />
            <View className="flex-1 flex-row gap-2 items-center justify-end">
              {themeModes.map((mode) => {
                const isSelected = mode === themeMode;
                const labelKey = `setting.theme.${mode}`;
                return (
                  <TouchableOpacity
                    key={mode}
                    className={`flex-row items-center justify-center rounded-full px-4 py-1 ${isSelected ? 'bg-component-background-2' : 'bg-component-background'
                      }`}
                    onPress={() => handleSelectTheme(mode)}
                  >
                    <Text 
                    text={t(labelKey)} 
                    type="body1" 
                    style={{ color: isSelected ? colors.TEXT : colors.TEXT_2}} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {/* 건의사항 */}
          <View className="w-full h-20 px-6 py-2 flex-row gap-4 items-center justify-between">
            <Text text={t('setting.feedback.sectionTitle')} type="title4" className="text-text" />
            <TouchableOpacity
              className="flex-row items-center justify-center rounded-full px-4 py-1 bg-component-background"
              onPress={handleOpenFeedback}
            >
              <Text 
                text={t('setting.feedback.button')} 
                type="body1" 
                style={{ color: colors.TEXT }} 
              />
            </TouchableOpacity>
          </View>
          {/* 별점 남기기 */}
          <View className="w-full h-20 px-6 py-2 flex-row gap-4 items-center justify-between">
            <Text text={t('setting.rateApp.sectionTitle')} type="title4" className="text-text" />
            <TouchableOpacity
              className="flex-row items-center justify-center rounded-full px-4 py-1 bg-component-background"
              onPress={handleRateApp}
            >
              <Text 
                text={t('setting.rateApp.button')} 
                type="body1" 
                style={{ color: colors.TEXT }} 
              />
            </TouchableOpacity>
          </View>
      </ScrollView>
      <AdmobNative />
      <TabBar />
    </Background>
  );
};