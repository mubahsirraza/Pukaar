
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { authService } from '../services/auth/authService';
import { useLanguage } from '../context/LanguageContext';

export default function ForgotPasswordScreen() {
  const { language, isRTL, fontFamily, t, setLanguage } = useLanguage();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const translatedFont = isRTL ? fontFamily : fonts.regular;
  const translatedBoldFont = isRTL ? fontFamily : fonts.bold;

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSubmit = async () => {
    setError('');

    if (!email.trim()) {
      setError(t.auth.requiredEmail);
      return;
    }

    if (!isValidEmail(email)) {
      setError(t.auth.invalidEmail);
      return;
    }

    try {
      setLoading(true);

      await authService.forgotPassword(email.trim().toLowerCase());

      setSubmitted(true);
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = async () => {
    setError('');
    await setLanguage(language === 'en' ? 'ur' : 'en');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>

            {/* Top navigation */}
            <View
              style={[
                styles.topRow,
                isRTL && styles.topRowRTL,
              ]}
            >
              <Pressable
                onPress={() => router.replace('/(auth)/login')}
                disabled={loading}
                hitSlop={8}
              >
                <Text
                  style={[
                    styles.backText,
                    { fontFamily: translatedBoldFont },
                  ]}
                >
                  {isRTL ? '→ ' : '← '}
                  {t.common.back}
                </Text>
              </Pressable>

              <Pressable
                onPress={toggleLanguage}
                disabled={loading}
                style={styles.languageButton}
              >
                <Text style={styles.languageButtonText}>
                  {language === 'en' ? 'اردو' : 'English'}
                </Text>
              </Pressable>
            </View>

            {/* Brand */}
            <View style={styles.brandSection}>
              <Image
                source={require('../../assets/images/pukaar-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {!submitted ? (
              <>
                {/* Heading */}
                <View style={styles.headingSection}>
                  <Text
                    style={[
                      styles.eyebrow,
                      {
                        fontFamily: translatedBoldFont,
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}
                  >
                    {t.passwordReset.title}
                  </Text>

                  <Text
                    style={[
                      styles.title,
                      {
                        fontFamily: translatedBoldFont,
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr',
                      },
                    ]}
                  >
                    {t.passwordReset.resetTitle}
                  </Text>

                  <Text
                    style={[
                      styles.description,
                      {
                        fontFamily: translatedFont,
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr',
                      },
                    ]}
                  >
                    {t.passwordReset.description}
                  </Text>
                </View>

                {/* Form */}
                <View style={styles.formCard}>
                  <Text
                    style={[
                      styles.formTitle,
                      {
                        fontFamily: translatedBoldFont,
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}
                  >
                    {t.auth.email}
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder={t.auth.emailPlaceholder}
                    placeholderTextColor="#92978F"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!loading}
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                    textAlign="left"
                    writingDirection="ltr"
                  />

                  {error ? (
                    <View style={styles.errorBox}>
                      <Text
                        style={[
                          styles.errorText,
                          {
                            fontFamily: translatedFont,
                            textAlign: isRTL ? 'right' : 'left',
                          },
                        ]}
                      >
                        {error}
                      </Text>
                    </View>
                  ) : null}

                  <Pressable
                    style={[
                      styles.primaryButton,
                      loading && styles.disabledButton,
                    ]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.textInverse} />
                    ) : (
                      <Text
                        style={[
                          styles.primaryButtonText,
                          { fontFamily: translatedBoldFont },
                        ]}
                      >
                        {t.passwordReset.sendLink}
                      </Text>
                    )}
                  </Pressable>

                  {loading ? (
                    <Text
                      style={[
                        styles.loadingText,
                        { fontFamily: translatedFont },
                      ]}
                    >
                      {t.passwordReset.sending}
                    </Text>
                  ) : null}
                </View>
              </>
            ) : (
              /* Success */
              <View style={styles.successCard}>
                <View style={styles.successIcon}>
                  <Text style={styles.successCheck}>✓</Text>
                </View>

                <Text
                  style={[
                    styles.successTitle,
                    {
                      fontFamily: translatedBoldFont,
                      textAlign: isRTL ? 'right' : 'left',
                    },
                  ]}
                >
                  {t.passwordReset.emailSent}
                </Text>

                <Text
                  style={[
                    styles.description,
                    {
                      fontFamily: translatedFont,
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    },
                  ]}
                >
                  {t.passwordReset.description}
                </Text>

                <Text style={styles.emailText}>
                  {email.trim().toLowerCase()}
                </Text>

                <Text
                  style={[
                    styles.hint,
                    { fontFamily: translatedFont },
                  ]}
                >
                  {isRTL
                    ? 'اپنا اِن باکس اور اسپیم فولڈر بھی چیک کریں۔'
                    : 'Please check your inbox and spam folder.'}
                </Text>

                <Pressable
                  style={styles.primaryButton}
                  onPress={() => router.replace('/(auth)/login')}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { fontFamily: translatedBoldFont },
                    ]}
                  >
                    {t.common.back}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.resendButton}
                  onPress={() => {
                    setSubmitted(false);
                    setError('');
                  }}
                >
                  <Text
                    style={[
                      styles.resendText,
                      { fontFamily: translatedBoldFont },
                    ]}
                  >
                    {isRTL ? 'دوسرا ای میل استعمال کریں' : 'Try another email'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerLine} />

              <Text style={styles.footerText}>
                YOUR COMMUNITY. YOUR VOICE.
              </Text>

              <View style={styles.footerLine} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 25,
    paddingVertical: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  topRowRTL: {
    flexDirection: 'row-reverse',
  },
  backText: {
    fontSize: 13,
    color: colors.primary,
  },
  languageButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  languageButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.primary,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 150,
    height: 95,
  },
  headingSection: {
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.secondary,
    marginBottom: 12,
  },
  title: {
    fontSize: 27,
    lineHeight: 43,
    color: colors.text,
  },
  description: {
    fontSize: 14,
    lineHeight: 26,
    color: colors.textSecondary,
    marginTop: 12,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 23,
  },
  formTitle: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  primaryButton: {
    height: 55,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    fontSize: 15,
    color: colors.textInverse,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  errorBox: {
    backgroundColor: colors.errorBackground,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 25,
    color: colors.error,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 25,
  },
  successIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.successBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successCheck: {
    fontSize: 28,
    color: colors.success,
    fontFamily: fonts.bold,
  },
  successTitle: {
    fontSize: 23,
    color: colors.text,
  },
  emailText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
    marginTop: 20,
  },
  hint: {
    fontSize: 12,
    lineHeight: 24,
    color: colors.textSecondary,
    marginTop: 18,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 13,
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 35,
  },
  footerLine: {
    width: 22,
    height: 1,
    backgroundColor: colors.border,
  },
  footerText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.1,
    color: colors.textSecondary,
  },
});
