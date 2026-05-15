// hooks/useDashboardAnalytics.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const COOLDOWN_MS = 12 * 60 * 60 * 1000;

export interface DashboardAnalytics {
  totalSolved: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  streak: number;
  score: number;
  subjectBreakdown: { subject: string; total: number; correct: number }[];
  recentActivity: { question_id: string; is_correct: boolean; created_at: string; subject?: string; chapter?: string }[];
}

export function useDashboardAnalytics() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const now = Date.now();
    const { data: attempts } = await supabase
      .from('user_attempts')
      .select('id, question_id, is_correct, selected_answer, created_at, questions(subject, chapter)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!attempts) { setLoading(false); return; }

    // Only count cooldown-active attempts (= meaningful attempts within 12h)
    const active = attempts.filter(a => {
      const age = now - new Date(a.created_at).getTime();
      return age < COOLDOWN_MS;
    });

    const totalSolved = active.length;
    const correctCount = active.filter(a => a.is_correct).length;
    const wrongCount = totalSolved - correctCount;
    const accuracy = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;
    const score = correctCount * 4 - wrongCount;

    // Streak — consecutive days with at least one attempt
    const daySet = new Set(attempts.map(a => new Date(a.created_at).toDateString()));
    let streak = 0;
    const d = new Date();
    while (daySet.has(d.toDateString())) {
      streak++;
      d.setDate(d.getDate() - 1);
    }

    // Subject breakdown
    const subMap: Record<string, { total: number; correct: number }> = {};
    active.forEach(a => {
      const sub = (a.questions as any)?.subject || 'unknown';
      if (!subMap[sub]) subMap[sub] = { total: 0, correct: 0 };
      subMap[sub].total++;
      if (a.is_correct) subMap[sub].correct++;
    });
    const subjectBreakdown = Object.entries(subMap).map(([subject, v]) => ({ subject, ...v }));

    // Recent activity (last 10)
    const recentActivity = attempts.slice(0, 10).map(a => ({
      question_id: a.question_id,
      is_correct: a.is_correct,
      created_at: a.created_at,
      subject: (a.questions as any)?.subject,
      chapter: (a.questions as any)?.chapter,
    }));

    setData({ totalSolved, correctCount, wrongCount, accuracy, streak, score, subjectBreakdown, recentActivity });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, refetch: load };
}
