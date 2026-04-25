import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
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

const OAUTH_REDIRECT = "mobile://auth-callback";

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

async function applyTokensFromUrl(url: string): Promise<void> {
  try {
    const hashStr = url.includes("#") ? url.split("#")[1] : "";
    const queryStr = url.includes("?")
      ? url.split("?")[1]?.split("#")[0]
      : "";
    const hash = new URLSearchParams(hashStr);
    const query = new URLSearchParams(queryStr);

    const access_token =
      hash.get("access_token") ?? query.get("access_token");
    const refresh_token =
      hash.get("refresh_token") ?? query.get("refresh_token");

    if (access_token) {
      await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token ?? "",
      });
      return;
    }

    // PKCE code exchange fallback
    const code = hash.get("code") ?? query.get("code");
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  } catch {}
}

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

  // Supabase auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // Deep-link listener for OAuth callbacks on Android (Chrome Custom Tabs
  // cannot intercept custom-scheme redirects automatically, so we catch them here)
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      if (url.includes("auth-callback")) {
        applyTokensFromUrl(url);
      }
    };

    const sub = Linking.addEventListener("url", handleUrl);

    // Handle the case where the app was cold-started via the deep link
    Linking.getInitialURL().then((url) => {
      if (url && url.includes("auth-callback")) applyTokensFromUrl(url);
    });

    return () => sub.remove();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    return {};
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user && !data.user.email_confirmed_at)
      return { needsConfirm: true };
    return {};
  };

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: OAUTH_REDIRECT,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url)
        return { error: error?.message ?? "Failed to get OAuth URL" };

      // Use openBrowserAsync on all platforms. On Android, openAuthSessionAsync
      // cannot intercept custom-scheme (mobile://) redirects inside Chrome Custom
      // Tabs — the browser stays open. openBrowserAsync lets Android's intent
      // system route the mobile:// deep link back to Expo Go naturally, and the
      // Linking listener above handles the session tokens.
      await WebBrowser.openBrowserAsync(data.url, {
        showInRecents: false,
        dismissButtonStyle: "close",
      });

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
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        saveProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
