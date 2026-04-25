import { Feather } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Post } from "@/lib/supabase";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type PostCardProps = {
  post: Post;
  score: number;
  myVote: number;
  commentCount: number;
  onVote: (postId: string, value: number) => void;
  onComments: (postId: string) => void;
};

export function PostCard({ post, score, myVote, commentCount, onVote, onComments }: PostCardProps) {
  const colors = useColors();
  const profile = post.profiles;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Feather name="user" size={16} color={colors.text2} />
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.authorName, { color: colors.foreground }]}>
            {profile?.name || "Anonymous"}
          </Text>
          <Text style={[styles.meta, { color: colors.text2 }]}>
            {profile?.class ? `${profile.class} · ` : ""}{timeAgo(post.created_at)}
          </Text>
        </View>
      </View>

      {post.title ? (
        <Text style={[styles.title, { color: colors.foreground }]}>{post.title}</Text>
      ) : null}
      <Text style={[styles.content, { color: colors.text2 }]} numberOfLines={4}>
        {post.content}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.voteBtn, myVote === 1 && { backgroundColor: "rgba(124,111,255,0.15)" }]}
          onPress={() => onVote(post.id, 1)}
        >
          <Feather name="chevron-up" size={18} color={myVote === 1 ? colors.primary : colors.text2} />
          {score > 0 ? (
            <Text style={[styles.voteCount, { color: colors.primary }]}>{score}</Text>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.voteBtn, myVote === -1 && { backgroundColor: "rgba(255,59,92,0.12)" }]}
          onPress={() => onVote(post.id, -1)}
        >
          <Feather name="chevron-down" size={18} color={myVote === -1 ? colors.red : colors.text2} />
          {score < 0 ? (
            <Text style={[styles.voteCount, { color: colors.red }]}>{Math.abs(score)}</Text>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentBtn} onPress={() => onComments(post.id)}>
          <Feather name="message-circle" size={15} color={colors.text2} />
          <Text style={[styles.commentCount, { color: colors.text2 }]}>
            {commentCount > 0 ? commentCount : "Comment"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
    marginTop: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  content: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  voteCount: {
    fontSize: 13,
    fontWeight: "700",
  },
  commentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  commentCount: {
    fontSize: 13,
    fontWeight: "500",
  },
});
