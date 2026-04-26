import { Image as ImageIcon, Trophy, X, Zap } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase, Post, Profile } from "@/lib/supabase";
import { PostCard } from "@/components/PostCard";
import { AppHeader } from "@/components/AppHeader";

const SUPABASE_URL = "https://biqdrsqirzxnznyucwtz.supabase.co";
const CLOUDINARY_CLOUD = "dn5uwablh";
const CLOUDINARY_PRESET = "study_aura_unsigned";
const MAX_IMAGES = 5;

type PostWithMeta = {
  post: Post;
  score: number;
  myVote: number;
  commentCount: number;
};

type LeaderboardEntry = {
  profile: Profile;
  totalStudySeconds: number;
  rank: number;
};

type TabType = "feed" | "leaderboard";

async function uploadToCloudinary(uri: string): Promise<string> {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const type = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  const formData = new FormData();
  formData.append("file", { uri, type, name: `post_${Date.now()}.${ext}` } as any);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", "study_aura/posts");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Upload failed");
  return data.secure_url as string;
}

function formatStudyHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0 && minutes === 0) return "0m";
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function getRankDisplay(rank: number): { bg: string; textColor: string; label: string } {
  if (rank === 1) return { bg: "#ffd166", textColor: "#1a1200", label: "🥇" };
  if (rank === 2) return { bg: "#c0c0c0", textColor: "#0a0a0a", label: "🥈" };
  if (rank === 3) return { bg: "#cd7f32", textColor: "#ffffff", label: "🥉" };
  return { bg: "rgba(124,111,255,0.12)", textColor: "#7c6fff", label: `${rank}` };
}

export default function CommunityScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, session } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("feed");

  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardRefreshing, setLeaderboardRefreshing] = useState(false);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);

  const [title, setTitle] = useState("");
  const [newPost, setNewPost] = useState("");
  const [images, setImages] = useState<{ uri: string; cloudUrl: string | null; uploading: boolean }[]>([]);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const { data: rawPosts } = await supabase
      .from("posts")
      .select("*, profiles(id, name, avatar_url, class, target_year, role)")
      .order("created_at", { ascending: false })
      .limit(30);

    if (!rawPosts) { setLoading(false); return; }
    const postIds = rawPosts.map((p: any) => p.id);

    const [{ data: votes }, { data: myVotes }, { data: allComments }] = await Promise.all([
      supabase.from("votes").select("post_id, value").in("post_id", postIds),
      user ? supabase.from("votes").select("post_id, value").eq("user_id", user.id).in("post_id", postIds) : Promise.resolve({ data: [] }),
      supabase.from("comments").select("id, post_id").in("post_id", postIds),
    ]);

    const scoreMap: Record<string, number> = {};
    (votes || []).forEach((v: any) => { scoreMap[v.post_id] = (scoreMap[v.post_id] || 0) + v.value; });
    const myVoteMap: Record<string, number> = {};
    (myVotes || []).forEach((v: any) => { myVoteMap[v.post_id] = v.value; });
    const commentCountMap: Record<string, number> = {};
    (allComments || []).forEach((c: any) => { commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1; });

    setPosts(rawPosts.map((p: any) => ({
      post: p as Post,
      score: scoreMap[p.id] || 0,
      myVote: myVoteMap[p.id] || 0,
      commentCount: commentCountMap[p.id] || 0,
    })));
    setLoading(false);
  }, [user]);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const [{ data: profiles }, { data: sessions }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, avatar_url, class, target_year, aura_score, aura_level")
          .order("aura_score", { ascending: false })
          .limit(50),
        supabase
          .from("study_sessions")
          .select("user_id, duration_seconds")
          .eq("status", "complete"),
      ]);

      const studyMap: Record<string, number> = {};
      (sessions || []).forEach((s: any) => {
        if (s.duration_seconds) {
          studyMap[s.user_id] = (studyMap[s.user_id] || 0) + s.duration_seconds;
        }
      });

      const entries: LeaderboardEntry[] = (profiles || []).map((p: any, idx: number) => ({
        profile: p as Profile,
        totalStudySeconds: studyMap[p.id] || 0,
        rank: idx + 1,
      }));

      setLeaderboard(entries);
      setLeaderboardLoaded(true);
    } catch (e) {
      console.error("Leaderboard load error", e);
    }
    setLeaderboardLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (activeTab === "leaderboard" && !leaderboardLoaded) {
      loadLeaderboard();
    }
  }, [activeTab, leaderboardLoaded, loadLeaderboard]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const onLeaderboardRefresh = async () => {
    setLeaderboardRefreshing(true);
    await loadLeaderboard();
    setLeaderboardRefreshing(false);
  };

  const castVote = async (postId: string, value: number) => {
    if (!user) return;
    const { data: existing } = await supabase.from("votes").select("id, value").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
    if (existing) {
      if ((existing as any).value === value) await supabase.from("votes").delete().eq("id", (existing as any).id);
      else await supabase.from("votes").update({ value }).eq("id", (existing as any).id);
    } else {
      await supabase.from("votes").insert({ post_id: postId, user_id: user.id, value });
    }
    load();
  };

  const pickImages = async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { Alert.alert("Limit reached", `Max ${MAX_IMAGES} images per post.`); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: remaining,
    });
    if (result.canceled) return;
    const newEntries = result.assets.map((a) => ({ uri: a.uri, cloudUrl: null as string | null, uploading: true }));
    setImages((prev) => [...prev, ...newEntries]);
    const startIdx = images.length;
    for (let i = 0; i < newEntries.length; i++) {
      const idx = startIdx + i;
      try {
        const url = await uploadToCloudinary(newEntries[i].uri);
        setImages((prev) => prev.map((x, j) => j === idx ? { ...x, cloudUrl: url, uploading: false } : x));
      } catch {
        setImages((prev) => prev.filter((_, j) => j !== idx));
        Alert.alert("Upload failed", "Could not upload one of the images.");
      }
    }
  };

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const submitPost = async () => {
    if (!session) return;
    if (!newPost.trim() && !title.trim() && images.length === 0) { Alert.alert("Empty post", "Write something or add an image first."); return; }
    if (images.some((x) => x.uploading)) { Alert.alert("Please wait", "Images are still uploading."); return; }
    setPosting(true);
    try {
      const payload: any = { content: newPost.trim() || " " };
      if (title.trim()) payload.title = title.trim();
      const cloudUrls = images.map((x) => x.cloudUrl).filter(Boolean);
      if (cloudUrls.length) payload.image_urls = cloudUrls;
      await fetch(`${SUPABASE_URL}/functions/v1/create-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      });
      setTitle(""); setNewPost(""); setImages([]);
      load();
    } catch (e: any) { Alert.alert("Error", e.message); }
    setPosting(false);
  };

  const goToPost = (postId: string) => router.push(`/post/${postId}`);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    tabRow: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 4,
      backgroundColor: colors.surface2,
      borderRadius: 12,
      padding: 3,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 10,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    tabBtnActive: {
      backgroundColor: colors.card,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    tabBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.text2 },
    tabBtnTextActive: { color: colors.foreground },
    composer: { marginTop: 8, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 8 },
    titleInput: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10, marginBottom: 10 },
    composerInput: { fontSize: 14, color: colors.foreground, minHeight: 70, textAlignVertical: "top", fontFamily: "Inter_400Regular" },
    thumbRow: { flexDirection: "row", marginTop: 10, marginBottom: 4 },
    thumbCard: { width: 72, height: 72, borderRadius: 8, overflow: "hidden", marginRight: 8, position: "relative" },
    thumbImg: { width: "100%", height: "100%" },
    thumbOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
    thumbRemove: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" },
    composerFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
    imageBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: colors.surface2 },
    imageBtnText: { fontSize: 13, color: colors.text2, fontFamily: "Inter_500Medium" },
    postBtn: { backgroundColor: colors.primary, paddingHorizontal: 22, paddingVertical: 9, borderRadius: 20, minWidth: 70, alignItems: "center" },
    postBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
    feedList: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 120 },
    lbList: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 120 },
    emptyText: { color: colors.text2, textAlign: "center", paddingVertical: 40, fontSize: 14, fontFamily: "Inter_400Regular" },
    lbHeaderContainer: { paddingVertical: 12, paddingBottom: 8 },
    lbHeaderTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 2 },
    lbHeaderSub: { fontSize: 12, color: colors.text2, fontFamily: "Inter_400Regular" },
    lbRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 8,
      gap: 12,
    },
    lbRowHighlight: { borderColor: "rgba(124,111,255,0.3)" },
    rankBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    rankLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface3, flexShrink: 0 },
    avatarPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface3,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    avatarInitial: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.primary },
    lbInfo: { flex: 1, minWidth: 0 },
    lbName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 2 },
    lbMeta: { fontSize: 12, color: colors.text2, fontFamily: "Inter_400Regular" },
    lbStats: { alignItems: "flex-end", gap: 3, flexShrink: 0 },
    auraRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    auraScoreText: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.primary },
    auraCaption: { fontSize: 10, color: colors.text2, fontFamily: "Inter_400Regular" },
    auraLevelBadge: {
      backgroundColor: "rgba(124,111,255,0.15)",
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    auraLevelText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: colors.primary },
    studyRow: { flexDirection: "row", alignItems: "center", gap: 3 },
    studyTimeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.cyan },
    studyCaption: { fontSize: 10, color: colors.text2, fontFamily: "Inter_400Regular" },
  });

  const TabSwitcher = (
    <View style={s.tabRow}>
      <TouchableOpacity
        style={[s.tabBtn, activeTab === "feed" && s.tabBtnActive]}
        onPress={() => setActiveTab("feed")}
        activeOpacity={0.7}
      >
        <Text style={[s.tabBtnText, activeTab === "feed" && s.tabBtnTextActive]}>Feed</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.tabBtn, activeTab === "leaderboard" && s.tabBtnActive]}
        onPress={() => setActiveTab("leaderboard")}
        activeOpacity={0.7}
      >
        <Trophy size={13} color={activeTab === "leaderboard" ? colors.gold : colors.text2} />
        <Text style={[s.tabBtnText, activeTab === "leaderboard" && s.tabBtnTextActive]}>Leaderboard</Text>
      </TouchableOpacity>
    </View>
  );

  const Composer = user ? (
    <View style={s.composer}>
      <TextInput style={s.titleInput} placeholder="Post title (optional)" placeholderTextColor={colors.text3} value={title} onChangeText={setTitle} />
      <TextInput style={s.composerInput} placeholder="Share something with the community..." placeholderTextColor={colors.text3} multiline value={newPost} onChangeText={setNewPost} />
      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.thumbRow}>
          {images.map((img, i) => (
            <View key={i} style={s.thumbCard}>
              <Image source={{ uri: img.uri }} style={s.thumbImg} />
              {img.uploading && <View style={s.thumbOverlay}><ActivityIndicator color="#fff" size="small" /></View>}
              <TouchableOpacity style={s.thumbRemove} onPress={() => removeImage(i)}><X size={12} color="#fff" /></TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={s.composerFooter}>
        <TouchableOpacity style={[s.imageBtn, images.length >= MAX_IMAGES && { opacity: 0.4 }]} onPress={pickImages} disabled={images.length >= MAX_IMAGES}>
          <ImageIcon size={18} color={colors.text2} />
          <Text style={s.imageBtnText}>{images.length > 0 ? `${images.length}/${MAX_IMAGES}` : "Photo"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.postBtn, (posting || images.some(x => x.uploading)) && { opacity: 0.6 }]} onPress={submitPost} disabled={posting || images.some(x => x.uploading)}>
          {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.postBtnText}>Post</Text>}
        </TouchableOpacity>
      </View>
    </View>
  ) : null;

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    const rank = getRankDisplay(item.rank);
    const isTop3 = item.rank <= 3;
    const initial = (item.profile.name || "?").charAt(0).toUpperCase();

    return (
      <View style={[s.lbRow, isTop3 && s.lbRowHighlight]}>
        <View style={[s.rankBadge, { backgroundColor: rank.bg }]}>
          <Text style={[s.rankLabel, { color: rank.textColor }]}>{rank.label}</Text>
        </View>

        {item.profile.avatar_url ? (
          <Image source={{ uri: item.profile.avatar_url }} style={s.avatar} />
        ) : (
          <View style={s.avatarPlaceholder}>
            <Text style={s.avatarInitial}>{initial}</Text>
          </View>
        )}

        <View style={s.lbInfo}>
          <Text style={s.lbName} numberOfLines={1}>{item.profile.name || "Anonymous"}</Text>
          <Text style={s.lbMeta} numberOfLines={1}>
            {[item.profile.class, item.profile.target_year].filter(Boolean).join(" · ") || "Student"}
          </Text>
        </View>

        <View style={s.lbStats}>
          <View style={s.auraRow}>
            <Zap size={12} color={colors.primary} />
            <Text style={s.auraScoreText}>{(item.profile.aura_score ?? 0).toLocaleString()}</Text>
          </View>
          {item.profile.aura_level ? (
            <View style={s.auraLevelBadge}>
              <Text style={s.auraLevelText}>{item.profile.aura_level}</Text>
            </View>
          ) : (
            <Text style={s.auraCaption}>Aura</Text>
          )}
          <View style={s.studyRow}>
            <Text style={s.studyTimeText}>{formatStudyHours(item.totalStudySeconds)}</Text>
            <Text style={s.studyCaption}>studied</Text>
          </View>
        </View>
      </View>
    );
  };

  const LeaderboardHeader = (
    <View style={s.lbHeaderContainer}>
      <Text style={s.lbHeaderTitle}>🏆 Top Students</Text>
      <Text style={s.lbHeaderSub}>Ranked by Aura Score · Study hours shown</Text>
    </View>
  );

  return (
    <View style={s.container}>
      <AppHeader title="COMMUNITY" />
      {TabSwitcher}

      {activeTab === "feed" ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.post.id}
          contentContainerStyle={s.feedList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={Composer}
          ListEmptyComponent={
            loading
              ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
              : <Text style={s.emptyText}>No posts yet. Be the first!</Text>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item.post}
              score={item.score}
              myVote={item.myVote}
              commentCount={item.commentCount}
              onVote={castVote}
              onComments={goToPost}
              onPress={() => goToPost(item.post.id)}
            />
          )}
        />
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.profile.id}
          contentContainerStyle={s.lbList}
          refreshControl={<RefreshControl refreshing={leaderboardRefreshing} onRefresh={onLeaderboardRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={LeaderboardHeader}
          ListEmptyComponent={
            leaderboardLoading
              ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
              : <Text style={s.emptyText}>No data yet. Start studying!</Text>
          }
          renderItem={renderLeaderboardItem}
        />
      )}
    </View>
  );
}
