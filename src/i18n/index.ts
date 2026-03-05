import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import fil from './locales/fil.json';
import zh from './locales/zh.json';

const resources = {
  en:  { translation: en },
  fil: { translation: fil },
  zh:  { translation: zh },
};

// Detect device locale → map to supported language
function detectLanguage(): string {
  const locale = Localization.getLocales()[0]?.languageCode ?? 'en';
  if (locale.startsWith('zh')) return 'zh';
  if (locale.startsWith('fil') || locale.startsWith('tl')) return 'fil';
  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React Native handles XSS
    },
    compatibilityJSON: "v4"
  });

export default i18n;

// Supported languages list (for Settings picker)
export const SUPPORTED_LANGUAGES = [
  { code: 'en',  label: 'English',  nativeLabel: 'English' },
  { code: 'fil', label: 'Filipino', nativeLabel: 'Filipino' },
  { code: 'zh',  label: 'Chinese',  nativeLabel: '中文' },
] as const;

export type LanguageCode = 'en' | 'fil' | 'zh';
