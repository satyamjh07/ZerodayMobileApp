import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function AuthScreen() {
  const colors = useColors();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const result = await signIn(email.trim(), password);
        if (result.error) Alert.alert("Sign In Failed", result.error);
      } else {
        const result = await signUp(email.trim(), password);
        if (result.error) {
          Alert.alert("Sign Up Failed", result.error);
        } else if (result.needsConfirm) {
          Alert.alert(
            "Check your email",
            "We sent you a confirmation link. Please verify your email before signing in.",
          );
          setMode("login");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <LinearGradient
        colors={["#050508", "#0a0b14", "#050508"]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.header}>
            <LinearGradient
              colors={["#7c6fff", "#00d4ff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.logoGradient}
            >
              <Text style={s.logoText}>Z</Text>
            </LinearGradient>
            <Text style={s.brand}>ZEROday</Text>
            <Text style={s.tagline}>Study smarter. Level up your aura.</Text>
          </View>

          <View style={s.card}>
            <View style={s.toggle}>
              <Pressable
                style={[s.toggleBtn, mode === "login" && s.toggleActive]}
                onPress={() => setMode("login")}
              >
                <Text
                  style={[
                    s.toggleText,
                    mode === "login" && s.toggleTextActive,
                  ]}
                >
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                style={[s.toggleBtn, mode === "signup" && s.toggleActive]}
                onPress={() => setMode("signup")}
              >
                <Text
                  style={[
                    s.toggleText,
                    mode === "signup" && s.toggleTextActive,
                  ]}
                >
                  Sign Up
                </Text>
              </Pressable>
            </View>

            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <View style={s.inputRow}>
                <Feather
                  name="mail"
                  size={16}
                  color={colors.text2}
                  style={s.inputIcon}
                />
                <TextInput
                  style={s.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.text3}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <View style={s.inputRow}>
                <Feather
                  name="lock"
                  size={16}
                  color={colors.text2}
                  style={s.inputIcon}
                />
                <TextInput
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.text3}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={s.eyeBtn}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={16}
                    color={colors.text2}
                  />
                </Pressable>
              </View>
            </View>

            {mode === "signup" && (
              <View style={s.field}>
                <Text style={s.label}>Confirm Password</Text>
                <View style={s.inputRow}>
                  <Feather
                    name="lock"
                    size={16}
                    color={colors.text2}
                    style={s.inputIcon}
                  />
                  <TextInput
                    style={s.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.text3}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            <Pressable
              style={[s.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={["#7c6fff", "#5a4de6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.submitText}>
                    {mode === "login" ? "Sign In" : "Create Account"}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#050508" },
    container: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    header: { alignItems: "center", marginBottom: 40 },
    logoGradient: {
      width: 72,
      height: 72,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    logoText: {
      fontSize: 36,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
    brand: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      letterSpacing: 2,
      marginBottom: 8,
    },
    tagline: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.text2,
      textAlign: "center",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggle: {
      flexDirection: "row",
      backgroundColor: colors.surface2,
      borderRadius: 12,
      padding: 4,
      marginBottom: 24,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 10,
    },
    toggleActive: {
      backgroundColor: colors.primary,
    },
    toggleText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.text2,
    },
    toggleTextActive: {
      color: "#fff",
    },
    field: { marginBottom: 16 },
    label: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.text2,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface3,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 8 },
    input: {
      flex: 1,
      height: 48,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      fontSize: 15,
    },
    eyeBtn: { padding: 4 },
    submitBtn: { marginTop: 8, borderRadius: 14, overflow: "hidden" },
    submitGradient: {
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    submitText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Inter_700Bold",
    },
  });
