import { ChevronDown, ChevronUp, MessageCircle, MoreHorizontal, User, VolumeX, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Post } from "@/lib/supabase";
import { ReportModal } from "@/components/ReportModal";
import { MuteModal } from "@/components/MuteModal";
import { supabase } from "@/lib/supabase";

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
  if (typeof post.image_urls === "string" && post.image_urls.length > 2) {
    try { return JSON.parse(post.image_urls); } catch { return []; }
  }
  return [];
}

type PostCardProps = {
  post: Post;
  score: number;
  myVote: number;
  commentCount: number;
  onVote: (postId: string, value: number) => void;
  onComments: (postId: string) => void;
  onPress?: () => void;
  onDeleted?: () => void;
};

export function PostCard({ post, score, myVote, commentCount, onVote, onComments, onPress, onDeleted }: PostCardProps) {
  const colors = useColors();
  const { user, profile } = useAuth();
  const images = parseImages(post);
  const postProfile = post.profiles;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [muteVisible, setMuteVisible] = useState(false);

  const canModerate = profile?.role === "admin" || profile?.role === "mod";
  const isOwnPost = user?.id === post.user_id;

  const gridW = SCREEN_W - 64;
  const half = (gridW - 4) / 2;

  const handleDelete = async () => {
    setMenuVisible(false);
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (!error) onDeleted?.();
  };

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
        <View style={s.header}>
          <View style={[s.avatar, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            {postProfile?.avatar_url ? (
              <Image source={{ uri: postProfile.avatar_url }} style={s.avatarImg} />
            ) : (
              <User size={16} color={colors.text2} />
            )}
          </View>
          <View style={s.headerInfo}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[s.authorName, { color: colors.foreground }]}>{postProfile?.name || "Anonymous"}</Text>
              {postProfile?.role && postProfile.role !== "member" && (
                <View style={{ backgroundColor: postProfile.role === "admin" ? `${colors.red}22` : `${colors.orange}22`, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                  <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: postProfile.role === "admin" ? colors.red : colors.orange, textTransform: "uppercase" }}>{postProfile.role}</Text>
                </View>
              )}
            </View>
            <Text style={[s.meta, { color: colors.text2 }]}>
              {[postProfile?.class, postProfile?.target_year ? `Target ${postProfile.target_year}` : null, timeAgo(post.created_at)].filter(Boolean).join(" · ")}
            </Text>
          </View>
          {/* 3-dot menu */}
          <TouchableOpacity style={s.menuBtn} onPress={() => setMenuVisible(true)}>
            <MoreHorizontal size={18} color={colors.text3} />
          </TouchableOpacity>
        </View>

        {post.title ? <Text style={[s.title, { color: colors.foreground }]}>{post.title}</Text> : null}
        <Text style={[s.content, { color: colors.text2 }]} numberOfLines={4}>{post.content?.trim()}</Text>
      </TouchableOpacity>

      {images.length > 0 && (
        <View style={[s.imageGrid, { width: gridW }]}>
          {images.slice(0, 4).map((uri, i) => {
            const isOnly = images.length === 1;
            const cellW = isOnly ? gridW : i === 0 && images.length === 3 ? gridW : half;
            const cellH = isOnly ? Math.round(gridW * 0.6) : 130;
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
        <TouchableOpacity style={[s.voteBtn, myVote === 1 && { backgroundColor: `${colors.primary}22` }]} onPress={() => onVote(post.id, 1)}>
          <ChevronUp size={18} color={myVote === 1 ? colors.primary : colors.text2} />
          {score !== 0 && <Text style={[s.voteCount, { color: score > 0 ? colors.primary : colors.red }]}>{score > 0 ? `+${score}` : score}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[s.voteBtn, myVote === -1 && { backgroundColor: `${colors.red}12` }]} onPress={() => onVote(post.id, -1)}>
          <ChevronDown size={18} color={myVote === -1 ? colors.red : colors.text2} />
        </TouchableOpacity>
        <TouchableOpacity style={s.commentBtn} onPress={() => onComments(post.id)}>
          <MessageCircle size={15} color={colors.text2} />
          <Text style={[s.commentCount, { color: colors.text2 }]}>{commentCount > 0 ? commentCount : "Comment"}</Text>
        </TouchableOpacity>
      </View>

      {/* 3-dot dropdown */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={ms.overlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[ms.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity style={ms.menuItem} onPress={() => { setMenuVisible(false); setReportVisible(true); }}>
                <Text style={[ms.menuText, { color: colors.red }]}>🚩 Report Post</Text>
              </TouchableOpacity>
              {canModerate && !isOwnPost && postProfile && (
                <TouchableOpacity style={ms.menuItem} onPress={() => { setMenuVisible(false); setMuteVisible(true); }}>
                  <VolumeX size={14} color={colors.orange} />
                  <Text style={[ms.menuText, { color: colors.orange }]}>Mute {postProfile.name}</Text>
                </TouchableOpacity>
              )}
              {(canModerate || isOwnPost) && (
                <TouchableOpacity style={[ms.menuItem, { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={handleDelete}>
                  <Text style={[ms.menuText, { color: colors.red }]}>🗑️ Delete Post</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[ms.menuItem, { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={() => setMenuVisible(false)}>
                <X size={14} color={colors.text2} />
                <Text style={[ms.menuText, { color: colors.text2 }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ReportModal visible={reportVisible} type="post" targetId={post.id} onClose={() => setReportVisible(false)} />
      <MuteModal
        visible={muteVisible}
        targetUserId={postProfile?.id ?? null}
        targetUserName={postProfile?.name ?? null}
        onClose={() => setMuteVisible(false)}
      />

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
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, overflow: "hidden" },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  headerInfo: { flex: 1 },
  authorName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  meta: { fontSize: 12, marginTop: 1, fontFamily: "Inter_400Regular" },
  menuBtn: { padding: 4 },
  title: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 6 },
  content: { fontSize: 14, lineHeight: 21, marginBottom: 10, fontFamily: "Inter_400Regular" },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 12 },
  imageCell: { borderRadius: 8, overflow: "hidden", position: "relative" },
  gridImg: { width: "100%", height: "100%" },
  moreOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  moreText: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  voteBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 6, paddingHorizontal: 10, borderRadius: 20 },
  voteCount: { fontSize: 13, fontFamily: "Inter_700Bold" },
  commentBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  commentCount: { fontSize: 13, fontFamily: "Inter_500Medium" },
  lb: { flex: 1, backgroundColor: "#000" },
  lbClose: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 8 },
  lbCounter: { position: "absolute", bottom: 40, alignSelf: "center", color: "#fff", fontSize: 14, fontFamily: "Inter_500Medium" },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  menu: { minWidth: 200, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 13, paddingHorizontal: 16 },
  menuText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
