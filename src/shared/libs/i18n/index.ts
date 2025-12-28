// Polyfill for Intl.PluralRules (required for React Native)
import 'intl-pluralrules';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import enCommon from "@i18n/locales/en/common.json";
import enMap from "@i18n/locales/en/map.json";
import enArchive from "@i18n/locales/en/archive.json";
import enMore from "@i18n/locales/en/more.json";
import enMyInfo from "@i18n/locales/en/myInfo.json";
import enOnboarding from "@i18n/locales/en/onboarding.json";
import enChip from "@i18n/locales/en/chip.json";
import enErrors from "@i18n/locales/en/errors.json";
import koCommon from "@i18n/locales/ko/common.json";
import koMap from "@i18n/locales/ko/map.json";
import koArchive from "@i18n/locales/ko/archive.json";
import koMore from "@i18n/locales/ko/more.json";
import koMyInfo from "@i18n/locales/ko/myInfo.json";
import koOnboarding from "@i18n/locales/ko/onboarding.json";
import koChip from "@i18n/locales/ko/chip.json";
import koErrors from "@i18n/locales/ko/errors.json";

const resources = {
  en: {
    common: enCommon,
    map: enMap,
    archive: enArchive,
    more: enMore,
    myInfo: enMyInfo,
    onboarding: enOnboarding,
    chip: enChip,
    errors: enErrors,
  },
  ko: {
    common: koCommon,
    map: koMap,
    archive: koArchive,
    more: koMore,
    myInfo: koMyInfo,
    onboarding: koOnboarding,
    chip: koChip,
    errors: koErrors,
  }
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
    defaultNS: 'common',
    ns: ['common', 'map', 'archive', 'more', 'myInfo', 'onboarding', 'chip', 'errors'],
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


// Helper function to translate text with namespace
export const translate = (ns: string, key: string): string => {
  return i18n.t(key, { ns });
};

export default i18n;
