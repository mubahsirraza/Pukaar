
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { authService } from '../../services/auth/authService';
import { useLanguage } from '../../context/LanguageContext';

export default function LoginScreen() {
  const {
    language,
    isRTL,
    fontFamily,
    t,
    setLanguage,
  } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const translatedFont = isRTL ? fontFamily : fonts.regular;
  const translatedBoldFont = isRTL ? fontFamily : fonts.bold;

  const handleLogin = async () => {
    setError('');

    if (!email.trim()) {
      setError(t.auth.requiredEmail);
      return;
    }

    if (!password) {
      setError(t.auth.requiredPassword);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.auth.invalidEmail);
      return;
    }

    try {
      setLoading(true);

      const user = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });

      Alert.alert(
        t.common.success,
        `${t.auth.welcomeBack}, ${user.name}`
      );
    } catch {
      setError(t.auth.loginFailed);
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
            {/* Language switch */}
            <View
              style={[
                styles.languageRow,
                isRTL && styles.languageRowRTL,
              ]}
            >
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
    source={require('../../../assets/images/pukaar-logo.png')}
    style={styles.logo}
    resizeMode="contain"
  />
</View>

            {/* Heading */}
            <View style={styles.headingSection}>
              <Text
                style={[
                  styles.title,
                  {
                    fontFamily: translatedBoldFont,
                    textAlign: isRTL ? 'right' : 'center',
                  },
                ]}
              >
                {t.auth.welcomeBack}
              </Text>

              <Text
                style={[
                  styles.description,
                  {
                    fontFamily: translatedFont,
                    textAlign: isRTL ? 'right' : 'center',
                    writingDirection: isRTL ? 'rtl' : 'ltr',
                  },
                ]}
              >
                {t.auth.signInDescription}
              </Text>
            </View>

            {/* Login form */}
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
                {t.auth.signInTitle}
              </Text>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.label,
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
                  returnKeyType="next"
                  textAlign="left"
                  writingDirection="ltr"
                />
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <View
                  style={[
                    styles.passwordHeader,
                    isRTL && styles.passwordHeaderRTL,
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      {
                        fontFamily: translatedBoldFont,
                      },
                    ]}
                  >
                    {t.auth.password}
                  </Text>

                  <Pressable
                    onPress={() =>
                      router.push('/forgot-password')
                    }
                    disabled={loading}
                    hitSlop={8}
                  >
                    <Text
                      style={[
                        styles.forgotPassword,
                        { fontFamily: translatedFont },
                      ]}
                    >
                      {t.auth.forgotPassword}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder={t.auth.passwordPlaceholder}
                    placeholderTextColor="#92978F"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="current-password"
                    editable={!loading}
                    onSubmitEditing={handleLogin}
                    returnKeyType="go"
                    textAlign="left"
                    writingDirection="ltr"
                  />

                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    hitSlop={10}
                  >
                    <Text style={styles.showPassword}>
                      {showPassword
                        ? t.auth.hidePassword
                        : t.auth.showPassword}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Error */}
              {error ? (
                <View style={styles.errorBox}>
                  <Text
                    style={[
                      styles.errorText,
                      {
                        fontFamily: translatedFont,
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr',
                      },
                    ]}
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Sign in */}
              <Pressable
                style={[
                  styles.loginButton,
                  loading && styles.disabledButton,
                ]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Text
                    style={[
                      styles.loginButtonText,
                      { fontFamily: translatedBoldFont },
                    ]}
                  >
                    {t.auth.signIn}
                  </Text>
                )}
              </Pressable>

              {/* Register */}
              <View
                style={[
                  styles.registerRow,
                  isRTL && styles.registerRowRTL,
                ]}
              >
                <Text
                  style={[
                    styles.registerText,
                    {
                      fontFamily: translatedFont,
                    },
                  ]}
                >
                  {t.auth.noAccount}
                </Text>

                <Pressable
                  onPress={() => router.push('/(auth)/register')}
                  disabled={loading}
                  style={styles.registerLinkContainer}
                >
                  <Text
                    style={[
                      styles.registerLink,
                      { fontFamily: translatedBoldFont },
                    ]}
                  >
                    {t.auth.createAccount}
                  </Text>
                </Pressable>
              </View>
            </View>

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
    paddingVertical: 22,
  },
  languageRow: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  languageRowRTL: {
    alignItems: 'flex-start',
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
    marginBottom: 25,
  },
  logo: {
    width: 105,
    height: 105,
    marginBottom: 5,
  },
  
 
  headingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 25,
    color: colors.text,
  },
  description: {
    fontSize: 13,
    lineHeight: 25,
    color: colors.textSecondary,
    marginTop: 10,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
  },
  formTitle: {
    fontSize: 20,
    color: colors.text,
  },
  fieldGroup: {
    marginTop: 22,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginBottom: 9,
  },
  input: {
    height: 53,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  forgotPassword: {
    fontSize: 12,
    color: colors.primary,
  },
  passwordContainer: {
    height: 53,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: colors.background,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  showPassword: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.primary,
    padding: 7,
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
  loginButton: {
    height: 54,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.65,
  },
  loginButtonText: {
    fontSize: 15,
    color: colors.textInverse,
  },
  registerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  registerRowRTL: {
    flexDirection: 'row-reverse',
  },
  registerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  registerLinkContainer: {
    alignItems: 'center',
  },
  registerLink: {
    fontSize: 12,
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 25,
  },
  footerLine: {
    width: 22,
    height: 1,
    backgroundColor: colors.border,
  },
  footerText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.textSecondary,
  },
});
