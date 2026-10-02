import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { loginUser } from '../api/authApi';

/* =========================================================
   COLORS
========================================================= */

const COLORS = {
  orange: '#FA7C35',
  orangeDark: '#E96828',

  background: '#FAF7F5',
  white: '#FFFFFF',

  text: '#292726',
  textSecondary: '#77716D',
  textLight: '#9B9591',

  border: '#E8E1DD',

  error: '#D9534F',
};

/* =========================================================
   LOGIN SCREEN
========================================================= */

export default function LoginScreen() {
  const router = useRouter();

  /* ================= FORM STATE ================= */

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /* ================= UI STATE ================= */

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= ERROR STATE ================= */

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    let valid = true;

    setEmailError('');
    setPasswordError('');

    /* Email */

    if (!email.trim()) {
      setEmailError('Please enter your email.');
      valid = false;
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setEmailError('Please enter a valid email.');
      valid = false;
    }

    /* Password */

    if (!password) {
      setPasswordError('Please enter your password.');
      valid = false;
    }

    return valid;
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      /*
       * Backend call
       *
       * ตอนนี้ API ยังไม่ได้เชื่อมจริง
       * เมื่อ Backend พร้อม function นี้จะเรียก
       * POST /auth/login
       */

        const result = await loginUser({
        email: email.trim(),
        password,
      });

      console.log('LOGIN SUCCESS:', result);

      /*
       * TODO:
       *
       * เก็บ token / user session
       *
       * เช่น
       * await saveToken(result.token);
       *
       * แล้วค่อย redirect
       */

      router.replace('/');
    } catch (error: any) {
      console.log('LOGIN ERROR:', error);

      Alert.alert(
        'Login failed',
        error?.message ||
          'Unable to login. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FORGOT PASSWORD
  ========================================================= */

  const handleForgotPassword = () => {
    /*
     * สามารถทำเป็น:
     *
     * router.push('/forgot-password')
     *
     * ในอนาคต
     */

    Alert.alert(
      'Forgot Password',
      'Password reset will be available soon.'
    );
  };

  /* =========================================================
     SIGN UP
  ========================================================= */

  const handleSignup = () => {
    router.push('/signup');
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <Text style={styles.logo}>
            Know <Text style={styles.logoAccent}>KKU</Text>
          </Text>

          <Text style={styles.welcome}>
            Welcome back!
          </Text>

          <Text style={styles.subtitle}>
            Login to continue your KKU journey
          </Text>

        </View>

        {/* =================================================
            LOGIN CARD
        ================================================= */}

        <View style={styles.loginCard}>

          <Text style={styles.loginTitle}>
            Login
          </Text>

          <Text style={styles.loginDescription}>
            Sign in to your account
          </Text>

          {/* =================================================
              EMAIL
          ================================================= */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Email
            </Text>

            <View
              style={[
                styles.inputContainer,
                emailError && styles.inputError,
              ]}
            >

              <Ionicons
                name="mail-outline"
                size={17}
                color={
                  emailError
                    ? COLORS.error
                    : COLORS.textLight
                }
              />

              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);

                  if (emailError) {
                    setEmailError('');
                  }
                }}
                placeholder="Enter your email"
                placeholderTextColor="#AAA39F"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.input}
                returnKeyType="next"
              />

            </View>

            {emailError ? (
              <Text style={styles.errorText}>
                {emailError}
              </Text>
            ) : null}

          </View>

          {/* =================================================
              PASSWORD
          ================================================= */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Password
            </Text>

            <View
              style={[
                styles.inputContainer,
                passwordError && styles.inputError,
              ]}
            >

              <Ionicons
                name="lock-closed-outline"
                size={17}
                color={
                  passwordError
                    ? COLORS.error
                    : COLORS.textLight
                }
              />

              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);

                  if (passwordError) {
                    setPasswordError('');
                  }
                }}
                placeholder="Enter your password"
                placeholderTextColor="#AAA39F"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  setShowPassword(!showPassword)
                }
                disabled={loading}
              >
                <Ionicons
                  name={
                    showPassword
                      ? 'eye-outline'
                      : 'eye-off-outline'
                  }
                  size={18}
                  color="#99928E"
                />
              </TouchableOpacity>

            </View>

            {passwordError ? (
              <Text style={styles.errorText}>
                {passwordError}
              </Text>
            ) : null}

          </View>

          {/* =================================================
              FORGOT PASSWORD
          ================================================= */}

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.forgotButton}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={styles.forgotText}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* =================================================
              LOGIN BUTTON
          ================================================= */}

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.loginButton,
              loading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >

            {loading ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Text style={styles.loginButtonText}>
                  Login
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#FFFFFF"
                />
              </>
            )}

          </TouchableOpacity>

          {/* =================================================
              SIGN UP
          ================================================= */}

          <View style={styles.signupContainer}>

            <Text style={styles.signupText}>
              Don't have an account?
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.signupLink}>
                Sign up
              </Text>
            </TouchableOpacity>

          </View>

        </View>

        {/* =================================================
            FOOTER
        ================================================= */}

        <Text style={styles.footer}>
          Know KKU • Your campus companion
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  /* ================= CONTAINER ================= */

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,

    paddingHorizontal: 22,
    paddingTop: 55,
    paddingBottom: 25,
  },

  /* ================= HEADER ================= */

  header: {
    alignItems: 'center',

    marginBottom: 28,
  },

  logo: {
    fontSize: 26,
    fontWeight: '800',

    color: COLORS.text,

    letterSpacing: -0.7,

    marginBottom: 18,
  },

  logoAccent: {
    color: COLORS.orange,
  },

  welcome: {
    fontSize: 22,
    fontWeight: '700',

    color: COLORS.text,

    marginBottom: 7,
  },

  subtitle: {
    fontSize: 12,

    color: COLORS.textSecondary,

    textAlign: 'center',

    lineHeight: 18,
  },

  /* ================= LOGIN CARD ================= */

  loginCard: {
    width: '100%',

    backgroundColor: COLORS.white,

    borderRadius: 25,

    paddingHorizontal: 20,
    paddingVertical: 23,

    shadowColor: '#9E938D',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.10,
    shadowRadius: 12,

    elevation: 3,
  },

  loginTitle: {
    fontSize: 19,
    fontWeight: '700',

    color: COLORS.text,

    marginBottom: 4,
  },

  loginDescription: {
    fontSize: 10.5,

    color: COLORS.textSecondary,

    marginBottom: 22,
  },

  /* ================= INPUT ================= */

  inputGroup: {
    marginBottom: 15,
  },

  inputLabel: {
    fontSize: 10.5,
    fontWeight: '600',

    color: COLORS.text,

    marginBottom: 7,
  },

  inputContainer: {
    height: 45,

    borderRadius: 13,

    backgroundColor: '#FCFAF9',

    borderWidth: 1,
    borderColor: COLORS.border,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 13,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  input: {
    flex: 1,

    height: 45,

    fontSize: 11.5,

    color: COLORS.text,

    marginLeft: 9,

    paddingVertical: 0,
  },

  errorText: {
    fontSize: 9,

    color: COLORS.error,

    marginTop: 5,

    marginLeft: 2,
  },

  /* ================= FORGOT ================= */

  forgotButton: {
    alignSelf: 'flex-end',

    marginTop: -3,
    marginBottom: 19,
  },

  forgotText: {
    fontSize: 10,

    fontWeight: '600',

    color: COLORS.orange,
  },

  /* ================= LOGIN BUTTON ================= */

  loginButton: {
    height: 45,

    borderRadius: 14,

    backgroundColor: COLORS.orange,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,

    shadowColor: COLORS.orange,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 7,

    elevation: 3,
  },

  loginButtonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    fontSize: 12,

    fontWeight: '700',

    color: COLORS.white,
  },

  /* ================= SIGN UP ================= */

  signupContainer: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 20,
  },

  signupText: {
    fontSize: 10,

    color: COLORS.textSecondary,

    marginRight: 4,
  },

  signupLink: {
    fontSize: 10,

    fontWeight: '700',

    color: COLORS.orange,
  },

  /* ================= FOOTER ================= */

  footer: {
    fontSize: 8.5,

    color: '#AAA39F',

    textAlign: 'center',

    marginTop: 25,
  },
});