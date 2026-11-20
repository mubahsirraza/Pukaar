
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { useLanguage } from '../../context/LanguageContext';
import { authService } from '../../services/auth/authService';

export default function RegisterScreen() {
  const { language, isRTL, fontFamily, t, setLanguage } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const textFont = isRTL ? fontFamily : fonts.regular;
  const mediumFont = isRTL ? fontFamily : fonts.medium;
  const boldFont = isRTL ? fontFamily : fonts.bold;

  const changeLanguage = async () => {
    setError('');
    await setLanguage(language === 'en' ? 'ur' : 'en');
  };

  const handleRegister = async () => {
    setError('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setError(t.auth.nameRequired);
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      setError(t.auth.nameTooShort);
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail || !emailPattern.test(cleanEmail)) {
      setError(t.auth.invalidEmail);
      return;
    }

    if (password.length < 8 || password.length > 128) {
      setError(t.auth.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    try {
      setIsLoading(true);

      await authService.register({
        name: cleanName,
        email: cleanEmail,
        password,
        ...(cleanPhone ? { phone: cleanPhone } : {}),
      });

      // Registration also stores the returned JWT.
      // Sign out here because the user must sign in through the login screen.
      await authService.logout();

      Alert.alert(
        t.common.success,
        t.auth.registrationSuccess,
        [
          {
            text: t.common.continue,
            onPress: () => router.replace('/(auth)/login'),
          },
        ],
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message.toLowerCase() : '';

      if (
        message.includes('already exists') ||
        message.includes('already registered') ||
        message.includes('duplicate')
      ) {
        setError(t.auth.registrationFailed);
      } else {
        setError(t.auth.registrationFailed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      fontFamily: fonts.regular,
      textAlign: isRTL ? 'right' : 'left',
    },
  ];

  const labelStyle = [
    styles.label,
    {
      fontFamily: mediumFont,
      textAlign: isRTL ? 'right' : 'left',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Language switch */}
            <View
              style={[
                styles.topBar,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <Pressable
                onPress={() => router.replace('/(auth)/login')}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>
                  {isRTL ? '→' : '←'}{' '}
                  <Text style={{ fontFamily: textFont }}>
                    {t.common.back}
                  </Text>
                </Text>
              </Pressable>

              <Pressable
                onPress={changeLanguage}
                style={styles.languageButton}
              >
                <Text style={styles.languageButtonText}>
                  {language === 'en' ? 'اردو' : 'English'}
                </Text>
              </Pressable>
            </View>

            {/* Branding */}
            <View style={styles.brandSection}>
              <Image
                source={require('../../../assets/images/pukaar-logo.png')}
                style={styles.logo}
                contentFit="contain"
              />

              <View style={styles.communityBadge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>
                  COMMUNITY POWERED
                </Text>
              </View>

              <Text
                style={[
                  styles.heading,
                  {
                    fontFamily: boldFont,
                    textAlign: 'center',
                    lineHeight: isRTL ? 43 : 35,
                  },
                ]}
              >
                {t.auth.registerTitle}
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  {
                    fontFamily: textFont,
                    textAlign: 'center',
                    lineHeight: isRTL ? 31 : 23,
                  },
                ]}
              >
                {t.auth.registerDescription}
              </Text>
            </View>

            {/* Registration form */}
            <View style={styles.formCard}>
              {/* Full name */}
              <Text style={labelStyle}>{t.auth.fullName}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t.auth.fullNamePlaceholder}
                placeholderTextColor={colors.textSecondary}
                style={[
                  inputStyle,
                  {
                    writingDirection: isRTL ? 'rtl' : 'ltr',
                  },
                ]}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="next"
              />

              {/* Email */}
              <Text style={labelStyle}>{t.auth.email}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t.auth.emailPlaceholder}
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, styles.ltrInput]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!isLoading}
                returnKeyType="next"
              />

              {/* Phone */}
              <Text style={labelStyle}>{t.auth.phone}</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder={t.auth.phonePlaceholder}
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, styles.ltrInput]}
                keyboardType="phone-pad"
                editable={!isLoading}
                returnKeyType="next"
              />

              {/* Password */}
              <Text style={labelStyle}>{t.auth.password}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t.auth.passwordPlaceholder}
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.passwordInput,
                    { textAlign: 'left' },
                  ]}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                />

                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={10}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword
                      ? t.auth.hidePassword
                      : t.auth.showPassword}
                  </Text>
                </Pressable>
              </View>

              {/* Confirm password */}
              <Text style={labelStyle}>
                {t.auth.confirmPassword}
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t.auth.confirmPasswordPlaceholder}
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.passwordInput,
                    { textAlign: 'left' },
                  ]}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />

                <Pressable
                  onPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  hitSlop={10}
                >
                  <Text style={styles.showPasswordText}>
                    {showConfirmPassword
                      ? t.auth.hidePassword
                      : t.auth.showPassword}
                  </Text>
                </Pressable>
              </View>

              {/* Error message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Text
                    style={[
                      styles.errorText,
                      {
                        fontFamily: textFont,
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Create account */}
              <Pressable
                onPress={handleRegister}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.submitButton,
                  {
                    opacity: isLoading ? 0.7 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                {isLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color={colors.textInverse} />
                    <Text
                      style={[
                        styles.submitButtonText,
                        { fontFamily: boldFont },
                      ]}
                    >
                      {t.auth.creatingAccount}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.submitButtonText,
                      { fontFamily: boldFont },
                    ]}
                  >
                    {t.auth.createAccountButton}
                  </Text>
                )}
              </Pressable>

              {/* Login link */}
              <View
                style={[
                  styles.loginRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <Text
                  style={[
                    styles.loginText,
                    { fontFamily: textFont },
                  ]}
                >
                  {t.auth.alreadyHaveAccount}{' '}
                </Text>

                <Pressable
                  onPress={() => router.replace('/(auth)/login')}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.loginLink,
                      { fontFamily: boldFont },
                    ]}
                  >
                    {t.auth.signIn}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
              YOUR CITY. YOUR VOICE.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  container: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flex: 1,
  },
  topBar: {
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  languageButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  languageButtonText: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 150,
    height: 75,
    marginBottom: 12,
  },
  communityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 15,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    marginRight: 7,
  },
  badgeText: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 10,
    letterSpacing: 1,
  },
  heading: {
    color: colors.text,
    fontSize: 27,
    marginBottom: 7,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    maxWidth: 330,
  },
  formCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 23,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    paddingHorizontal: 15,
    color: colors.text,
    fontSize: 14,
  },
  ltrInput: {
    fontFamily: fonts.regular,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  passwordContainer: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    paddingHorizontal: 13,
  },
  passwordInput: {
    flex: 1,
    height: 52,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    paddingHorizontal: 2,
  },
  showPasswordText: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: colors.errorBackground,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
  submitButton: {
    height: 55,
    backgroundColor: colors.primary,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 23,
  },
  submitButtonText: {
    color: colors.textInverse,
    fontSize: 15,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loginRow: {
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 22,
  },
  loginText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  loginLink: {
    color: colors.primary,
    fontSize: 13,
  },
  footer: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 25,
    marginBottom: 12,
  },
});
