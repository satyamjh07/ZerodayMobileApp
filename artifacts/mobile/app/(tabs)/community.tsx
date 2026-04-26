import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase, Post, Comment } from "@/lib/supabase";
import { PostCard } from "@/components/PostCard";

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

async function uploadToCloudinary(uri: string): Promise<string> {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const type = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  const formData = new FormData();
  formData.append("file", { uri, type, name: `post_${Date.now()}.${ext}` } as any);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", "study_aura/posts");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Upload failed");
  return data.secure_url as string;
}

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();

  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Composer
  const [title, setTitle] = useState("");
  const [newPost, setNewPost] = useState("");
  const [images, setImages] = useState<{ uri: string; cloudUrl: string | null; uploading: boolean }[]>([]);
  const [posting, setPosting] = useState(false);

  // Comments modal
  const [commentsModal, setCommentsModal] = useState<{ postId: string; comments: Comment[] } | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

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

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const castVote = async (postId: string, value: number) => {
    if (!user) return;
    const { data: existing } = await supabase.from("votes").select("id, value").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
    if (existing) {
      if (existing.value === value) await supabase.from("votes").delete().eq("id", existing.id);
      else await supabase.from("votes").update({ value }).eq("id", existing.id);
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

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitPost = async () => {
    if (!session) return;
    if (!newPost.trim() && !title.trim() && images.length === 0) {
      Alert.alert("Empty post", "Write something or add an image first.");
      return;
    }
    if (images.some((x) => x.uploading)) {
      Alert.alert("Please wait", "Images are still uploading.");
      return;
    }
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
      setTitle("");
      setNewPost("");
      setImages([]);
      load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setPosting(false);
  };

  const openComments = async (postId: string) => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setCommentsModal({ postId, comments: (data || []) as Comment[] });
    setCommentInput("");
  };

  const submitComment = async () => {
    if (!commentInput.trim() || !commentsModal || !session) return;
    setSubmittingComment(true);
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/add-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ post_id: commentsModal.postId, content: commentInput.trim() }),
      });
      setCommentInput("");
      const { data } = await supabase.from("comments").select("*, profiles(name, avatar_url)").eq("post_id", commentsModal.postId).order("created_at", { ascending: true });
      setCommentsModal({ ...commentsModal, comments: (data || []) as Comment[] });
      load();
    } catch {}
    setSubmittingComment(false);
  };

  const styles = makeStyles(colors);

  const Composer = user ? (
    <View style={styles.composer}>
      {/* Title */}
      <TextInput
        style={styles.titleInput}
        placeholder="Post title (optional)"
        placeholderTextColor={colors.text3}
        value={title}
        onChangeText={setTitle}
      />
      {/* Content */}
      <TextInput
        style={styles.composerInput}
        placeholder="Share something with the community..."
        placeholderTextColor={colors.text3}
        multiline
        value={newPost}
        onChangeText={setNewPost}
      />
      {/* Image previews */}
      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
          {images.map((img, i) => (
            <View key={i} style={styles.thumbCard}>
              <Image source={{ uri: img.uri }} style={styles.thumbImg} />
              {img.uploading && (
                <View style={styles.thumbOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
              <TouchableOpacity style={styles.thumbRemove} onPress={() => removeImage(i)}>
                <Feather name="x" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
      {/* Footer */}
      <View style={styles.composerFooter}>
        <TouchableOpacity
          style={[styles.imageBtn, images.length >= MAX_IMAGES && { opacity: 0.4 }]}
          onPress={pickImages}
          disabled={images.length >= MAX_IMAGES}
        >
          <Feather name="image" size={18} color={colors.text2} />
          <Text style={styles.imageBtnText}>
            {images.length > 0 ? `${images.length}/${MAX_IMAGES}` : "Photo"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.postBtn, (posting || images.some(x => x.uploading)) && { opacity: 0.6 }]}
          onPress={submitPost}
          disabled={posting || images.some(x => x.uploading)}
        >
          {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postBtnText}>Post</Text>}
        </TouchableOpacity>
      </View>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>COMMUNITY</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.post.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={Composer}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.emptyText}>No posts yet. Be the first!</Text>
          )
        }
        renderItem={({ item }) => (
          <PostCard
            post={item.post}
            score={item.score}
            myVote={item.myVote}
            commentCount={item.commentCount}
            onVote={castVote}
            onComments={openComments}
          />
        )}
      />

      {/* Comments modal */}
      <Modal visible={!!commentsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentsModal(null)}>
                <Feather name="x" size={20} color={colors.text2} />
              </TouchableOpacity>
            </View>
            <FlatList
              style={styles.commentsList}
              data={commentsModal?.comments || []}
              keyExtractor={(c) => c.id}
              ListEmptyComponent={<Text style={styles.noComments}>No comments yet. Be the first!</Text>}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <View style={[styles.commentAvatar, { backgroundColor: colors.surface2 }]}>
                      {item.profiles?.avatar_url ? (
                        <Image source={{ uri: item.profiles.avatar_url }} style={styles.commentAvatarImg} />
                      ) : (
                        <Feather name="user" size={12} color={colors.text3} />
                      )}
                    </View>
                    <Text style={[styles.commentAuthor, { color: colors.foreground }]}>
                      {item.profiles?.name || "Anonymous"}
                    </Text>
                  </View>
                  <Text style={[styles.commentContent, { color: colors.text2 }]}>{item.content}</Text>
                </View>
              )}
            />
            {user && (
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInputField}
                  placeholder="Write a comment..."
                  placeholderTextColor={colors.text3}
                  value={commentInput}
                  onChangeText={setCommentInput}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.commentSendBtn, { backgroundColor: colors.primary }]}
                  onPress={submitComment}
                  disabled={submittingComment}
                >
                  {submittingComment ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Feather name="send" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof import("@/hooks/useColors").useColors>) {
  const insets = { top: 16 };
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "android" ? 16 : 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground, letterSpacing: 1 },
    composer: { margin: 16, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 8 },
    titleInput: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 10,
      marginBottom: 10,
    },
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
    list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },
    emptyText: { color: colors.text2, textAlign: "center", paddingVertical: 40, fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
    modalContainer: { flex: 1, marginTop: 80, backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground },
    commentsList: { flex: 1, padding: 16 },
    commentItem: { marginBottom: 16 },
    commentHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    commentAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    commentAvatarImg: { width: 28, height: 28, borderRadius: 14 },
    commentAuthor: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    commentContent: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular", paddingLeft: 36 },
    commentInputRow: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 10, alignItems: "flex-end" },
    commentInputField: { flex: 1, backgroundColor: colors.surface2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.foreground, maxHeight: 100, fontFamily: "Inter_400Regular" },
    commentSendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
    noComments: { color: colors.text3, textAlign: "center", paddingVertical: 30, fontFamily: "Inter_400Regular" },
  });
}
