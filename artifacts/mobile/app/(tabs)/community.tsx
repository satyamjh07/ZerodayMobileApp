import { Image as ImageIcon, Trophy, X, Zap, MessageSquare, TrendingUp } from "lucide-react-native";
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
import { supabase, Post } from "@/lib/supabase";
import { PostCard } from "@/components/PostCard";
import { AppHeader } from "@/components/AppHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { useLeaderboard } from "@/hooks/useLeaderboard";

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

export default function CommunityScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, session } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Use the new solver-based leaderboard hook
  const { entries: leaderboard, loading: lbLoading, refetch: refetchLb } = useLeaderboard(50);

  const [title, setTitle] = useState("");
  const [newPost, setNewPost] = useState("");
  const [images, setImages] = useState<{ uri: string; cloudUrl: string | null; uploading: boolean }[]>([]);
  const [posting, setPosting] = useState(false);

  const loadFeed = useCallback(async () => {
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

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const onRefresh = async () => { 
    setRefreshing(true); 
    if (activeTab === "feed") await loadFeed();
    else await refetchLb();
    setRefreshing(false); 
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
    loadFeed();
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
      loadFeed();
    } catch (e: any) { Alert.alert("Error", e.message); }
    setPosting(false);
  };

  const goToPost = (postId: string) => router.push(`/post/${postId}`);

  const renderLeaderboardItem = ({ item, index }: { item: any, index: number }) => {
    const isTop3 = index < 3;
    const initial = (item.name || "?").charAt(0).toUpperCase();

    return (
      <GlassCard style={[styles.lbRow, isTop3 && { borderColor: index === 0 ? colors.gold : index === 1 ? '#C0C0C0' : '#CD7F32' }]}>
        <View style={[styles.rankBadge, { backgroundColor: isTop3 ? (index === 0 ? colors.gold : index === 1 ? '#C0C0C0' : '#CD7F32') : colors.surface2 }]}>
          <Text style={[styles.rankLabel, { color: isTop3 ? '#000' : colors.text2 }]}>{index + 1}</Text>
        </View>

        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface3 }]}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{initial}</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={[styles.lbName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.lbMeta, { color: colors.text3 }]}>{item.totalSolved} Questions Solved</Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <View style={styles.auraRow}>
            <Zap size={14} color={colors.primary} />
            <Text style={[styles.auraScoreText, { color: colors.primary }]}>{item.score}</Text>
          </View>
          <Text style={[styles.auraCaption, { color: colors.text3 }]}>{item.accuracy}% Acc.</Text>
        </View>
      </GlassCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="COMMUNITY" />
      
      <View style={styles.tabRow}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'feed' && { backgroundColor: colors.card }]}
          onPress={() => setActiveTab('feed')}
        >
          <MessageSquare size={16} color={activeTab === 'feed' ? colors.primary : colors.text2} />
          <Text style={[styles.tabBtnText, { color: activeTab === 'feed' ? colors.foreground : colors.text2 }]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'leaderboard' && { backgroundColor: colors.card }]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <TrendingUp size={16} color={activeTab === 'leaderboard' ? colors.primary : colors.text2} />
          <Text style={[styles.tabBtnText, { color: activeTab === 'leaderboard' ? colors.foreground : colors.text2 }]}>Ranking</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "feed" ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.post.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View style={styles.composer}>
              <TextInput 
                style={[styles.composerInput, { color: colors.foreground, borderColor: colors.border }]} 
                placeholder="Share your progress or ask a question..." 
                placeholderTextColor={colors.text3} 
                multiline 
                value={newPost} 
                onChangeText={setNewPost} 
              />
              <View style={styles.composerActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={pickImages}>
                  <ImageIcon size={20} color={colors.text2} />
                  <Text style={{ color: colors.text2, marginLeft: 6 }}>{images.length || 'Photo'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.postBtn, { backgroundColor: colors.primary }]} 
                  onPress={submitPost}
                  disabled={posting}
                >
                  <Text style={styles.postBtnText}>{posting ? '...' : 'Post'}</Text>
                </TouchableOpacity>
              </View>
            </View>
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
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View style={styles.lbHeader}>
              <Text style={[styles.lbHeaderTitle, { color: colors.foreground }]}>Hall of Fame</Text>
              <Text style={[styles.lbHeaderSub, { color: colors.text3 }]}>Top performers based on solver activity</Text>
            </View>
          }
          renderItem={renderLeaderboardItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: { flexDirection: 'row', margin: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 8 },
  tabBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  composer: { marginBottom: 20 },
  composerInput: { borderRadius: 16, borderWidth: 1, padding: 16, minHeight: 100, textAlignVertical: 'top', fontFamily: 'Inter_400Regular' },
  composerActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  postBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  postBtnText: { color: '#fff', fontFamily: 'Inter_700Bold' },
  lbHeader: { marginBottom: 16, marginTop: 10 },
  lbHeaderTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  lbHeaderSub: { fontSize: 12, marginTop: 4 },
  lbRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10, gap: 12 },
  rankBadge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  lbName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  lbMeta: { fontSize: 11, marginTop: 2 },
  auraRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  auraScoreText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  auraCaption: { fontSize: 10, marginTop: 2 }
});

