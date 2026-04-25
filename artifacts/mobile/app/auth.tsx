import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function AuthScreen() {
  const colors = useColors();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (Platform.OS !== "web") {
      WebBrowser.warmUpAsync();
      return () => { WebBrowser.coolDownAsync(); };
    }
  }, []);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) Alert.alert("Google Sign-In Failed", result.error);
    } finally {
      setGoogleLoading(false);
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
            <Image
              source={{ uri: "https://res.cloudinary.com/dn5uwablh/image/upload/f_auto,q_auto,w_200,h_200,c_fill,g_face/v1777051164/study_aura/avatars/wm6dfcqjj0kuzwommyfu.png" }}
              style={s.logo}
              resizeMode="cover"
            />
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

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            <Pressable
              style={[s.googleBtn, googleLoading && { opacity: 0.7 }]}
              onPress={handleGoogle}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.foreground} />
              ) : (
                <>
                  <GoogleIcon />
                  <Text style={s.googleText}>Continue with Google</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GoogleIcon() {
  return (
    <View style={{ width: 20, height: 20, marginRight: 10 }}>
      <Image
        source={{ uri: "https://www.google.com/favicon.ico" }}
        style={{ width: 20, height: 20 }}
        resizeMode="contain"
      />
    </View>
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
    logo: {
      width: 88,
      height: 88,
      borderRadius: 24,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: "rgba(124, 111, 255, 0.35)",
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
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 20,
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.text2,
    },
    googleBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface3,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
    },
    googleText: {
      color: colors.foreground,
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
    },
  });
