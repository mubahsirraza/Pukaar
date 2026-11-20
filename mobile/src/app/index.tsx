
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';

import { colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

export default function IndexScreen() {
  const {
    isReady,
    hasSelectedLanguage,
  } = useLanguage();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (hasSelectedLanguage) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(onboarding)/language');
    }
  }, [isReady, hasSelectedLanguage]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator
        size="large"
        color={colors.primary}
      />
    </View>
  );
}
