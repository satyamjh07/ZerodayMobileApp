import { ChevronDown, ChevronUp, Flag, MoreHorizontal, Send, User, VolumeX, X } from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { AppHeader } from "@/components/AppHeader";
import { ReportModal } from "@/components/ReportModal";
import { MuteModal } from "@/components/MuteModal";

const SUPABASE_URL = "https://biqdrsqirzxnznyucwtz.supabase.co";
const { width: SCREEN_W } = Dimensions.get("window");

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function parseImages(post: Post): string[] {
  if (Array.isArray(post.image_urls) && post.image_urls.length) return post.image_urls;
  if (typeof post.image_urls === "string" && (post.image_urls as string).length > 2) {
    try { return JSON.parse(post.image_urls as any); } catch { return []; }
  }
  return [];
}

type CommentMenuState = { commentId: string; userId: string; userName: string } | null;

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, session, profile: myProfile } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [score, setScore] = useState(0);
  const [myVote, setMyVote] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [reportPostVisible, setReportPostVisible] = useState(false);
  const [commentMenu, setCommentMenu] = useState<CommentMenuState>(null);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [muteTarget, setMuteTarget] = useState<{ id: string; name: string } | null>(null);

  const canModerate = myProfile?.role === "admin" || myProfile?.role === "mod";

  const load = useCallback(async () => {
    if (!id) return;
    const [postRes, votesRes, myVoteRes, commentsRes] = await Promise.all([
      supabase.from("posts").select("*, profiles(id, name, avatar_url, class, target_year, role)").eq("id", id).single(),
      supabase.from("votes").select("value").eq("post_id", id),
      user
        ? supabase.from("votes").select("value").eq("post_id", id).eq("user_id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("comments").select("*, profiles(id, name, avatar_url, role)").eq("post_id", id).order("created_at", { ascending: true }),
    ]);

    if (postRes.data) setPost(postRes.data as Post);
    setScore((votesRes.data || []).reduce((a: number, v: any) => a + v.value, 0));
    setMyVote((myVoteRes.data as any)?.value || 0);
    setComments((commentsRes.data || []) as Comment[]);
    setLoading(false);
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  const castVote = async (value: number) => {
    if (!user || !post) return;
    const { data: existing } = await supabase.from("votes").select("id, value").eq("post_id", post.id).eq("user_id", user.id).maybeSingle();
    if (existing) {
      if ((existing as any).value === value) await supabase.from("votes").delete().eq("id", (existing as any).id);
      else await supabase.from("votes").update({ value }).eq("id", (existing as any).id);
    } else {
      await supabase.from("votes").insert({ post_id: post.id, user_id: user.id, value });
    }
    load();
  };

  const submitComment = async () => {
    if (!commentInput.trim() || !session || !post) return;
    setSubmitting(true);
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/add-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ post_id: post.id, content: commentInput.trim() }),
      });
      setCommentInput("");
      load();
    } catch {}
    setSubmitting(false);
  };

  const deleteComment = async (commentId: string) => {
    Alert.alert("Delete Comment", "Remove this comment?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await supabase.from("comments").delete().eq("id", commentId); load(); } },
    ]);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    postWrap: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    postHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    avatarImg: { width: 40, height: 40, borderRadius: 20 },
    authorName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    postMeta: { fontSize: 12, color: colors.text2, fontFamily: "Inter_400Regular", marginTop: 1 },
    postTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 10, lineHeight: 26 },
    postContent: { fontSize: 15, color: colors.text2, lineHeight: 23, fontFamily: "Inter_400Regular", marginBottom: 14 },
    imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 14 },
    imageCell: { borderRadius: 8, overflow: "hidden" },
    gridImg: { width: "100%", height: "100%" },
    moreOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
    moreText: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
    actions: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 4 },
    voteBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
    scoreText: { fontSize: 14, fontFamily: "Inter_700Bold", minWidth: 24, textAlign: "center" },
    reportBtn: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: colors.surface2 },
    reportText: { fontSize: 12, color: colors.text3, fontFamily: "Inter_500Medium" },
    commentsSectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: colors.text3, textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    commentItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    commentHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
    commentAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    commentAvatarImg: { width: 30, height: 30, borderRadius: 15 },
    commentAuthor: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    commentTime: { fontSize: 11, color: colors.text3, fontFamily: "Inter_400Regular", marginLeft: 4 },
    commentContent: { fontSize: 14, color: colors.text2, lineHeight: 20, fontFamily: "Inter_400Regular" },
    commentMoreBtn: { marginLeft: "auto", padding: 4 },
    commentInputRow: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 10, alignItems: "flex-end", backgroundColor: colors.background },
    commentField: { flex: 1, backgroundColor: colors.surface2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.foreground, maxHeight: 100, fontFamily: "Inter_400Regular" },
    sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
    lb: { flex: 1, backgroundColor: "#000" },
    lbClose: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 8 },
    lbCounter: { position: "absolute", bottom: 40, alignSelf: "center", color: "#fff", fontSize: 14, fontFamily: "Inter_500Medium" },
    menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    menuCard: { minWidth: 200, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
    menuItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 13, paddingHorizontal: 16 },
    menuItemText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <AppHeader title="POST" showBack />
        <View style={s.loadWrap}><ActivityIndicator color={colors.primary} /></View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={s.container}>
        <AppHeader title="POST" showBack />
        <View style={s.loadWrap}><Text style={{ color: colors.text2 }}>Post not found.</Text></View>
      </View>
    );
  }

  const postProfile = post.profiles;
  const images = parseImages(post);
  const gridW = SCREEN_W - 32;
  const half = (gridW - 4) / 2;

  return (
    <View style={s.container}>
      <AppHeader title="POST" showBack />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView keyboardShouldPersistTaps="handled">
          {/* Post body */}
          <View style={s.postWrap}>
            <View style={s.postHeader}>
              <View style={s.avatar}>
                {postProfile?.avatar_url
                  ? <Image source={{ uri: postProfile.avatar_url }} style={s.avatarImg} />
                  : <User size={18} color={colors.text2} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.authorName}>{postProfile?.name || "Anonymous"}</Text>
                <Text style={s.postMeta}>
                  {[postProfile?.class, postProfile?.target_year ? `Target ${postProfile.target_year}` : null, timeAgo(post.created_at)].filter(Boolean).join(" · ")}
                </Text>
              </View>
            </View>

            {post.title ? <Text style={s.postTitle}>{post.title}</Text> : null}
            <Text style={s.postContent}>{post.content?.trim()}</Text>

            {images.length > 0 && (
              <View style={[s.imageGrid, { width: gridW }]}>
                {images.slice(0, 4).map((uri, i) => {
                  const isOnly = images.length === 1;
                  const cellW = isOnly ? gridW : half;
                  const cellH = isOnly ? Math.round(gridW * 0.65) : 150;
                  const isLast = i === 3 && images.length > 4;
                  return (
                    <TouchableOpacity key={i} style={[s.imageCell, { width: cellW, height: cellH }]} onPress={() => setLightboxIndex(i)} activeOpacity={0.9}>
                      <Image source={{ uri }} style={s.gridImg} resizeMode="cover" />
                      {isLast && <View style={s.moreOverlay}><Text style={s.moreText}>+{images.length - 4}</Text></View>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={s.actions}>
              <TouchableOpacity style={[s.voteBtn, myVote === 1 && { backgroundColor: `${colors.primary}22` }]} onPress={() => castVote(1)}>
                <ChevronUp size={20} color={myVote === 1 ? colors.primary : colors.text2} />
              </TouchableOpacity>
              <Text style={[s.scoreText, { color: score > 0 ? colors.primary : score < 0 ? colors.red : colors.text2 }]}>
                {score > 0 ? `+${score}` : score}
              </Text>
              <TouchableOpacity style={[s.voteBtn, myVote === -1 && { backgroundColor: `${colors.red}12` }]} onPress={() => castVote(-1)}>
                <ChevronDown size={20} color={myVote === -1 ? colors.red : colors.text2} />
              </TouchableOpacity>
              <TouchableOpacity style={s.reportBtn} onPress={() => setReportPostVisible(true)}>
                <Flag size={13} color={colors.text3} />
                <Text style={s.reportText}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments */}
          <Text style={s.commentsSectionLabel}>
            {comments.length > 0 ? `${comments.length} Comment${comments.length !== 1 ? "s" : ""}` : "No comments yet"}
          </Text>
          {comments.map((c) => {
            const cUser = c.profiles;
            const isOwnComment = user?.id === c.user_id;
            return (
              <View key={c.id} style={s.commentItem}>
                <View style={s.commentHeader}>
                  <View style={s.commentAvatar}>
                    {cUser?.avatar_url
                      ? <Image source={{ uri: cUser.avatar_url }} style={s.commentAvatarImg} />
                      : <User size={13} color={colors.text3} />}
                  </View>
                  <Text style={s.commentAuthor}>{cUser?.name || "Anonymous"}</Text>
                  <Text style={s.commentTime}>{timeAgo(c.created_at)}</Text>
                  {user && (
                    <TouchableOpacity
                      style={s.commentMoreBtn}
                      onPress={() => setCommentMenu({ commentId: c.id, userId: cUser?.id ?? "", userName: cUser?.name ?? "User" })}
                    >
                      <MoreHorizontal size={15} color={colors.text3} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={s.commentContent}>{c.content}</Text>
              </View>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>

        {user && (
          <View style={[s.commentInputRow, { paddingBottom: Platform.OS === "ios" ? insets.bottom : 12 }]}>
            <TextInput
              style={s.commentField}
              placeholder="Add a comment..."
              placeholderTextColor={colors.text3}
              value={commentInput}
              onChangeText={setCommentInput}
              multiline
            />
            <TouchableOpacity style={s.sendBtn} onPress={submitComment} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Send size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Image lightbox */}
      {lightboxIndex !== null && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setLightboxIndex(null)}>
          <View style={s.lb}>
            <TouchableOpacity style={s.lbClose} onPress={() => setLightboxIndex(null)}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: lightboxIndex * SCREEN_W, y: 0 }}>
              {images.map((uri, i) => <Image key={i} source={{ uri }} style={{ width: SCREEN_W, height: "100%" }} resizeMode="contain" />)}
            </ScrollView>
            <Text style={s.lbCounter}>{lightboxIndex + 1} / {images.length}</Text>
          </View>
        </Modal>
      )}

      {/* Comment 3-dot menu */}
      <Modal visible={!!commentMenu} transparent animationType="fade" onRequestClose={() => setCommentMenu(null)}>
        <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={() => setCommentMenu(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[s.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity style={s.menuItem} onPress={() => { setReportCommentId(commentMenu?.commentId ?? null); setCommentMenu(null); }}>
                <Flag size={14} color={colors.red} />
                <Text style={[s.menuItemText, { color: colors.red }]}>Report Comment</Text>
              </TouchableOpacity>
              {canModerate && commentMenu && commentMenu.userId !== user?.id && (
                <TouchableOpacity style={[s.menuItem, { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={() => { setMuteTarget({ id: commentMenu.userId, name: commentMenu.userName }); setCommentMenu(null); }}>
                  <VolumeX size={14} color={colors.orange} />
                  <Text style={[s.menuItemText, { color: colors.orange }]}>Mute {commentMenu.userName}</Text>
                </TouchableOpacity>
              )}
              {(canModerate || commentMenu?.userId === user?.id) && (
                <TouchableOpacity style={[s.menuItem, { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={() => { const cid = commentMenu?.commentId; setCommentMenu(null); if (cid) deleteComment(cid); }}>
                  <X size={14} color={colors.red} />
                  <Text style={[s.menuItemText, { color: colors.red }]}>Delete Comment</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[s.menuItem, { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={() => setCommentMenu(null)}>
                <X size={14} color={colors.text2} />
                <Text style={[s.menuItemText, { color: colors.text2 }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ReportModal visible={reportPostVisible} type="post" targetId={post?.id ?? null} onClose={() => setReportPostVisible(false)} />
      <ReportModal visible={!!reportCommentId} type="comment" targetId={reportCommentId} onClose={() => setReportCommentId(null)} />
      <MuteModal visible={!!muteTarget} targetUserId={muteTarget?.id ?? null} targetUserName={muteTarget?.name ?? null} onClose={() => setMuteTarget(null)} />
    </View>
  );
}
