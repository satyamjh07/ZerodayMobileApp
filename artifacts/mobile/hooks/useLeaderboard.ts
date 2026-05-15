// hooks/useLeaderboard.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar_url?: string;
  score: number;
  accuracy: number;
  totalSolved: number;
  rank: number;
}

export function useLeaderboard(limit = 10) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase
      .from('user_attempts')
      .select('user_id, is_correct, profiles(name, avatar_url)')
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    // Aggregate per user
    const userMap: Record<string, { name: string; avatar_url?: string; correct: number; total: number }> = {};
    data.forEach(row => {
      const uid = row.user_id;
      const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles as any;
      if (!userMap[uid]) userMap[uid] = { name: prof?.name || 'Student', avatar_url: prof?.avatar_url, correct: 0, total: 0 };
      userMap[uid].total++;
      if (row.is_correct) userMap[uid].correct++;
    });

    const sorted = Object.entries(userMap)
      .map(([userId, v]) => ({
        userId,
        name: v.name,
        avatar_url: v.avatar_url,
        score: v.correct * 4 - (v.total - v.correct),
        accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
        totalSolved: v.total,
        rank: 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    setEntries(sorted.slice(0, limit));
    if (user) {
      const me = sorted.find(e => e.userId === user.id);
      setMyRank(me?.rank ?? null);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => { load(); }, [load]);

  return { entries, myRank, loading, refetch: load };
}
