import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSignUp } from "@clerk/expo";

const KKU_EMAIL = /^[^\s@]+@(kku\.ac\.th|kkumail\.com)$/i;

export default function SignUpScreen() {
  const { signUp } = useSignUp();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ขั้นยืนยันอีเมล (Clerk ส่งรหัสไปที่อีเมล)
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const clerkMessage = (err: any, fallback: string) =>
    err?.errors?.[0]?.longMessage || err?.message || fallback;

  /* ================= STEP 1: CREATE ACCOUNT ================= */

  const handleSignUp = async () => {
    if (loading) return;

    setError("");

    // Basic validation
    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !phone
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (!KKU_EMAIL.test(email.trim())) {
      setError("Please use your @kkumail.com or @kku.ac.th email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { error: passwordError } = await signUp.password({
        emailAddress: email.trim(),
        password,
        username: username.trim(),
      });

      if (passwordError) {
        setError(clerkMessage(passwordError, "Unable to create account."));
        return;
      }

      const { error: metadataError } = await signUp.update({
        unsafeMetadata: {
          username: username.trim(),
          phone: phone.trim(),
        },
      });

      if (metadataError) {
        setError(clerkMessage(metadataError, "Unable to save account details."));
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();

      if (sendError) {
        setError(clerkMessage(sendError, "Unable to send a verification code."));
        return;
      }

      setPendingVerification(true);
    } catch (err: any) {
      setError(clerkMessage(err, "Unable to create account."));
    } finally {
      setLoading(false);
    }
  };

  /* ================= STEP 2: VERIFY EMAIL ================= */

  const handleVerify = async () => {
    if (loading) return;

    setError("");

    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    try {
      setLoading(true);

      const { error: updateError } = await signUp.update({
        username: username.trim(),
      });

      if (updateError) {
        setError(clerkMessage(updateError, "Unable to update your username."));
        return;
      }

      const { error: verifyError } = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });

      if (verifyError) {
        setError(clerkMessage(verifyError, "Invalid verification code."));
        return;
      }

      if (signUp.status !== "complete" || !signUp.createdSessionId) {
        const outstandingFields = [
          ...signUp.missingFields,
          ...signUp.unverifiedFields.map((field) => `${field} (verification required)`),
        ];

        setError(
          `Clerk still requires: ${outstandingFields.join(", ") || "additional account information"}. Check the required sign-up fields in Clerk.`
        );
        return;
      }

      const { error: finalizeError } = await signUp.finalize();

      if (finalizeError) {
        setError(clerkMessage(finalizeError, "Unable to start your session."));
      }
    } catch (err: any) {
      setError(clerkMessage(err, "Invalid verification code."));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading) return;

    setError("");

    try {
      const { error: resendError } = await signUp.verifications.sendEmailCode();
      if (resendError) {
        setError(clerkMessage(resendError, "Unable to resend the code."));
      }
    } catch (err: any) {
      setError(clerkMessage(err, "Unable to resend the code."));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Know KKU</Text>

          <Text style={styles.title}>
            {pendingVerification ? "Verify Email" : "Create Account"}
          </Text>

          <Text style={styles.subtitle}>
            {pendingVerification
              ? `We sent a verification code to ${email.trim()}`
              : "Join Know KKU and start your KKU journey"}
          </Text>
        </View>

        {/* Sign Up Card */}
        <View style={styles.card}>
          {pendingVerification ? (
            <>
              <Text style={styles.cardTitle}>Verification</Text>

              {/* Code */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color="#8A8A8A"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter the code"
                    placeholderTextColor="#A5A5A5"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Error */}
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.createButton,
                  (pressed || loading) && styles.buttonPressed,
                ]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.createButtonText}>
                    Verify Email
                  </Text>
                )}
              </Pressable>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Didn't get the code?
                </Text>

                <Pressable onPress={handleResend} disabled={loading}>
                  <Text style={styles.loginLink}> Resend</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Sign Up</Text>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#8A8A8A"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your username"
                    placeholderTextColor="#A5A5A5"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#8A8A8A"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#A5A5A5"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#8A8A8A"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#A5A5A5"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                  />

                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={
                        showPassword
                          ? "eye-outline"
                          : "eye-off-outline"
                      }
                      size={20}
                      color="#8A8A8A"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#8A8A8A"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#A5A5A5"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    editable={!loading}
                  />

                  <Pressable
                    onPress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? "eye-outline"
                          : "eye-off-outline"
                      }
                      size={20}
                      color="#8A8A8A"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color="#8A8A8A"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#A5A5A5"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Error */}
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              {/* Create Account Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.createButton,
                  (pressed || loading) && styles.buttonPressed,
                ]}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.createButtonText}>
                    Create Account
                  </Text>
                )}
              </Pressable>

              {/* Required by Clerk's web sign-up protection. */}
              <View nativeID="clerk-captcha" />

              {/* Login */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Already have an account?
                </Text>

                <Pressable onPress={() => router.push("/login")}>
                  <Text style={styles.loginLink}> Login</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          © 2026 Know KKU
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F4",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
  },

  /* Header */
  header: {
    alignItems: "center",
    marginBottom: 28,
  },

  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F26522",
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#252525",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },

  /* Card */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 4,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#252525",
    marginBottom: 22,
  },

  /* Inputs */
  inputGroup: {
    marginBottom: 17,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },

  inputWrapper: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },

  inputIcon: {
    marginLeft: 15,
    marginRight: 9,
  },

  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#252525",
    paddingRight: 12,
  },

  eyeButton: {
    paddingHorizontal: 14,
    height: "100%",
    justifyContent: "center",
  },

  /* Error */
  errorText: {
    color: "#D93025",
    fontSize: 13,
    marginBottom: 14,
    marginTop: -3,
  },

  /* Button */
  createButton: {
    height: 54,
    backgroundColor: "#F26522",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  /* Login */
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },

  loginText: {
    fontSize: 14,
    color: "#777777",
  },

  loginLink: {
    fontSize: 14,
    color: "#F26522",
    fontWeight: "700",
  },

  /* Footer */
  footerText: {
    textAlign: "center",
    fontSize: 12,
    color: "#A0A0A0",
    marginTop: 25,
  },
});
