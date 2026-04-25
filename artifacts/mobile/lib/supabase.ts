import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://biqdrsqirzxnznyucwtz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcWRyc3Fpcnp4bnpueXVjd3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4Njk1MDgsImV4cCI6MjA5MjQ0NTUwOH0.fiPASLwVmwemIPqLaMcXoqGsa7P0Oa17vp3SUymPqG0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Profile = {
  id: string;
  email: string;
  name: string;
  class: string;
  target_year: string;
  bio?: string;
  avatar_url?: string;
  role: string;
  aura_score?: number;
  aura_level?: string;
  muted_until?: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  title?: string;
  image_urls?: string[];
  created_at: string;
  profiles?: Profile;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
};

export type StudySession = {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  status: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  user_id?: string;
  created_at: string;
  expires_at?: string;
};
