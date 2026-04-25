import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
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

type PostWithMeta = {
  post: Post;
  score: number;
  myVote: number;
  commentCount: number;
};

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
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
    const current = posts.find((p) => p.post.id === postId);
    if (!current) return;
    const { data: existing } = await supabase.from("votes").select("id, value").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
    if (existing) {
      if (existing.value === value) await supabase.from("votes").delete().eq("id", existing.id);
      else await supabase.from("votes").update({ value }).eq("id", existing.id);
    } else {
      await supabase.from("votes").insert({ post_id: postId, user_id: user.id, value });
    }
    load();
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

  const submitPost = async () => {
    if (!newPost.trim() || !session) return;
    setPosting(true);
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/create-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ content: newPost.trim() }),
      });
      setNewPost("");
      load();
    } catch {}
    setPosting(false);
  };

  const submitComment = async () => {
    if (!commentInput.trim() || !commentsModal || !session) return;
    setSubmittingComment(true);
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/create-comment`, {
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

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "web" ? 67 + insets.top : insets.top + 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 28, fontWeight: "800", color: colors.foreground, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
    composer: { margin: 16, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 14 },
    composerInput: { fontSize: 14, color: colors.foreground, minHeight: 60, textAlignVertical: "top", fontFamily: "Inter_400Regular" },
    composerFooter: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
    postBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
    postBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
    list: { paddingHorizontal: 16 },
    emptyText: { color: colors.text2, textAlign: "center", paddingVertical: 40, fontSize: 14 },
    loadingText: { color: colors.text2, textAlign: "center", paddingVertical: 40 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
    modalContainer: { flex: 1, marginTop: 80, backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
    commentsList: { flex: 1, padding: 16 },
    commentItem: { marginBottom: 16 },
    commentAuthor: { fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 2 },
    commentContent: { fontSize: 14, color: colors.text2, lineHeight: 20 },
    commentInput: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 10, alignItems: "flex-end" },
    commentInputField: { flex: 1, backgroundColor: colors.surface2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.foreground, maxHeight: 100 },
    commentSendBtn: { backgroundColor: colors.primary, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    noComments: { color: colors.text3, textAlign: "center", paddingVertical: 20 },
  });

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
        scrollEnabled={!!posts.length}
        ListHeaderComponent={
          user ? (
            <View style={styles.composer}>
              <TextInput
                style={styles.composerInput}
                placeholder="Share something with the community..."
                placeholderTextColor={colors.text3}
                multiline
                value={newPost}
                onChangeText={setNewPost}
              />
              <View style={styles.composerFooter}>
                <TouchableOpacity style={styles.postBtn} onPress={submitPost} disabled={posting || !newPost.trim()}>
                  <Text style={styles.postBtnText}>{posting ? "Posting..." : "Post"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.loadingText}>Loading posts...</Text>
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
              ListEmptyComponent={<Text style={styles.noComments}>No comments yet.</Text>}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>{item.profiles?.name || "Anonymous"}</Text>
                  <Text style={styles.commentContent}>{item.content}</Text>
                </View>
              )}
            />
            {user && (
              <View style={styles.commentInput}>
                <TextInput
                  style={styles.commentInputField}
                  placeholder="Write a comment..."
                  placeholderTextColor={colors.text3}
                  value={commentInput}
                  onChangeText={setCommentInput}
                  multiline
                />
                <TouchableOpacity style={styles.commentSendBtn} onPress={submitComment} disabled={submittingComment}>
                  <Feather name="send" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
