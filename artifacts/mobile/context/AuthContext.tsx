import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase, Profile } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  saveProfile: (data: Partial<Profile>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user && !data.user.email_confirmed_at) return { needsConfirm: true };
    return {};
  };

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    try {
      const redirectTo = makeRedirectUri({ scheme: "mobile", path: "auth-callback" });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) return { error: error?.message ?? "Failed to get OAuth URL" };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== "success") {
        return result.type === "cancel" ? {} : { error: "Authentication was dismissed" };
      }

      const url = result.url;
      const hashParams = url.includes("#")
        ? new URLSearchParams(url.split("#")[1])
        : null;
      const queryParams = url.includes("?")
        ? new URLSearchParams(url.split("?")[1].split("#")[0])
        : null;

      const access_token =
        hashParams?.get("access_token") ?? queryParams?.get("access_token");
      const refresh_token =
        hashParams?.get("refresh_token") ?? queryParams?.get("refresh_token");

      if (access_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token ?? "",
        });
        if (sessionError) return { error: sessionError.message };
      }

      return {};
    } catch (e: any) {
      return { error: e?.message ?? "Google sign-in failed" };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("sa_timer_start");
  };

  const saveProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      ...data,
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };
    await loadProfile(user.id);
    return {};
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signUp, signOut, signInWithGoogle, saveProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
