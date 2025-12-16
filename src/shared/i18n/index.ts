import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import en from "@i18n/locales/en.json";
import ko from "@i18n/locales/ko.json";

const resources = {
  en: { translation: en },
  ko: { translation: ko }
};

export const supportedLanguages = ['en', 'ko'] as const;
export type SupportedLanguage = typeof supportedLanguages[number];

// Helper function to get device language
const getDeviceLanguage = (): SupportedLanguage => {
  try {
    const locales = RNLocalize.getLocales();
    if (locales && locales.length > 0) {
      const languageCode = locales[0].languageCode;
      // Map device language codes to supported languages
      if (supportedLanguages.includes(languageCode as SupportedLanguage)) {
        return languageCode as SupportedLanguage;
      }
    }
  } catch (error) {
    console.error('Failed to get device language:', error);
  }
  return 'en'; // Default to English
};

// Initialize i18n with device language
const deviceLanguage = getDeviceLanguage();
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage, // Use device language as default
    fallbackLng: 'en',
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    compatibilityJSON: 'v4', // for better compatibility with React Native
  });

// Helper function to load saved language preference
export const loadSavedLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (savedLanguage && supportedLanguages.includes(savedLanguage as SupportedLanguage)) {
      return savedLanguage;
    }
    // If no saved language, use device language
    const currentDeviceLanguage = getDeviceLanguage();
    return currentDeviceLanguage;
  } catch (error) {
    console.error('Failed to load saved language:', error);
    // Fallback to device language or English
    return getDeviceLanguage();
  }
};

// Helper function to save language preference
export const saveLanguagePreference = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }
};

// Helper function to change language
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  await saveLanguagePreference(language);
  i18n.changeLanguage(language);
};


export default i18n;
