
import en from './en';
import ur from './ur';

export const translations = {
  en,
  ur,
};

export type Language = keyof typeof translations;

export type TranslationDictionary = typeof en;

export { en, ur };
