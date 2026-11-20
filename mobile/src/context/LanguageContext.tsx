
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  translations,
  type Language,
  type TranslationDictionary,
} from '../localization';

const LANGUAGE_STORAGE_KEY = '@pukaar/language-v2';

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  isReady: boolean;
  hasSelectedLanguage: boolean;
  fontFamily: string;
  t: TranslationDictionary;
  setLanguage: (language: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({
  children,
}: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isReady, setIsReady] = useState(false);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadLanguage() {
      try {
        const savedLanguage = await AsyncStorage.getItem(
          LANGUAGE_STORAGE_KEY
        );

        if (
          mounted &&
          savedLanguage &&
          Object.prototype.hasOwnProperty.call(
            translations,
            savedLanguage
          )
        ) {
          setLanguageState(savedLanguage as Language);
          setHasSelectedLanguage(true);
        }
      } catch (error) {
        console.warn('Unable to load saved language:', error);
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    void loadLanguage();

    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage: Language) => {
    await AsyncStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      nextLanguage
    );

    setLanguageState(nextLanguage);
    setHasSelectedLanguage(true);
  }, []);

  const value = useMemo<LanguageContextType>(() => {
    const isRTL = language === 'ur';

    return {
      language,
      isRTL,
      isReady,
      hasSelectedLanguage,
      fontFamily: isRTL
        ? 'NotoNastaliqUrdu_400Regular'
        : 'PlusJakartaSans_400Regular',
      t: translations[language],
      setLanguage,
    };
  }, [language, isReady, hasSelectedLanguage, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider.'
    );
  }

  return context;
}
