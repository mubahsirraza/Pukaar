
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { useLanguage } from '../../context/LanguageContext';
import { translations, type Language } from '../../localization';

export default function LanguageSelectionScreen() {
  const {
    language,
    isReady,
    setLanguage,
  } = useLanguage();

  const [selectedLanguage, setSelectedLanguage] =
    useState<Language>('en');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isReady) {
      setSelectedLanguage(language);
    }
  }, [isReady, language]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isUrdu = selectedLanguage === 'ur';
  const currentTranslations = translations[selectedLanguage];

  const handleContinue = async () => {
    try {
      setSaving(true);

      await setLanguage(selectedLanguage);

      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Unable to save language:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Original Pukaar logo */}
          <View style={styles.brandSection}>
            <Image
              source={require('../../../assets/images/pukaar-logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Pukaar logo"
            />

            <Text style={styles.tagline}>
              YOUR CITY. YOUR VOICE.
            </Text>
          </View>

          {/* Language heading */}
          <View style={styles.selectionSection}>
            <Text
              style={[
                styles.heading,
                isUrdu && styles.urduHeading,
              ]}
            >
              {currentTranslations.language.title}
            </Text>

            <Text
              style={[
                styles.description,
                isUrdu && styles.urduDescription,
              ]}
            >
              {currentTranslations.language.subtitle}
            </Text>

            {/* English */}
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{
                checked: selectedLanguage === 'en',
              }}
              onPress={() => setSelectedLanguage('en')}
              style={[
                styles.languageCard,
                selectedLanguage === 'en' && styles.selectedCard,
              ]}
            >
              <View style={styles.cardContent}>
                <View style={styles.languageSymbol}>
                  <Text style={styles.englishSymbol}>A</Text>
                </View>

                <View style={styles.englishTextContainer}>
                  <Text style={styles.englishTitle}>
                    English
                  </Text>

                  <Text style={styles.englishDescription}>
                    Continue in English
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.radio,
                  selectedLanguage === 'en' && styles.radioSelected,
                ]}
              />
            </Pressable>

            {/* Urdu */}
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{
                checked: selectedLanguage === 'ur',
              }}
              onPress={() => setSelectedLanguage('ur')}
              style={[
                styles.languageCard,
                styles.urduCard,
                selectedLanguage === 'ur' && styles.selectedCard,
              ]}
            >
              <View style={styles.urduCardContent}>
                <View style={styles.languageTextUrdu}>
                  <Text style={styles.urduTitle}>
                    اردو
                  </Text>

                  <Text style={styles.urduDescriptionCard}>
                    اردو میں جاری رکھیں
                  </Text>
                </View>

                <View style={styles.languageSymbol}>
                  <Text style={styles.urduSymbol}>ا</Text>
                </View>
              </View>

              <View
                style={[
                  styles.radio,
                  selectedLanguage === 'ur' && styles.radioSelected,
                ]}
              />
            </Pressable>
          </View>

          {/* Continue */}
          <View style={styles.footer}>
            <Pressable
              disabled={saving}
              onPress={handleContinue}
              style={({ pressed }) => [
                styles.continueButton,
                pressed && styles.buttonPressed,
                saving && styles.buttonDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text
                  style={[
                    styles.continueButtonText,
                    isUrdu && styles.urduButtonText,
                  ]}
                >
                  {currentTranslations.language.continue}
                </Text>
              )}
            </Pressable>

            <Text style={styles.footerText}>
              YOUR CITY. YOUR VOICE.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
  flexGrow: 1,
  width: '100%',
  maxWidth: 700,
  alignSelf: 'center',
  paddingHorizontal: 26,
  paddingVertical: 24,
  justifyContent: 'center',
},

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  brandSection: {
  alignItems: 'center',
  marginBottom: 24,
},
  logo: {
    width: 200,
    height: 105,
  },

  tagline: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textSecondary,
    marginTop: 4,
  },

  selectionSection: {
  width: '100%',
  maxWidth: 520,
  alignSelf: 'center',
},

  heading: {
    fontFamily: fonts.bold,
    fontSize: 25,
    lineHeight: 36,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },

  urduHeading: {
    fontFamily: 'NotoNastaliqUrdu_400Regular',
    fontSize: 21,
    lineHeight: 53,
    textAlign: 'center',
  },

  description: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 27,
  },

  urduDescription: {
    fontFamily: 'NotoNastaliqUrdu_400Regular',
    fontSize: 14,
    lineHeight: 42,
    textAlign: 'center',
    marginBottom: 25,
  },

  languageCard: {
    minHeight: 94,
    width: '100%',
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: '#F0F6F1',
  },

  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  languageSymbol: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  englishSymbol: {
    fontFamily: fonts.bold,
    fontSize: 29,
    color: colors.primary,
  },

  englishTextContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 5,
  },

  englishTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },

  englishDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },

  urduCard: {
    minHeight: 112,
  },

  urduCardContent: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
  },

  languageTextUrdu: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 2,
  },

  urduTitle: {
    width: '100%',
    fontFamily: 'NotoNastaliqUrdu_400Regular',
    fontSize: 18,
    lineHeight: 43,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  urduDescriptionCard: {
    width: '100%',
    fontFamily: 'NotoNastaliqUrdu_400Regular',
    fontSize: 13,
    lineHeight: 36,
    color: colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  urduSymbol: {
    fontFamily: 'NotoNastaliqUrdu_400Regular',
    fontSize: 25,
    lineHeight: 55,
    color: colors.primary,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexShrink: 0,
    marginLeft: 12,
  },

  radioSelected: {
    borderWidth: 6,
    borderColor: colors.primary,
  },

  footer: {
  width: '100%',
  maxWidth: 520,
  alignSelf: 'center',
  alignItems: 'center',
  gap: 16,
  paddingTop: 26,
},

  continueButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  continueButtonText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textInverse,
  },

  urduButtonText: {
    fontFamily: 'NotoNastaliqUrdu_400Regular',
    fontSize: 16,
    lineHeight: 45,
  },

  footerText: {
    fontFamily: fonts.medium,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.textSecondary,
  },
});
