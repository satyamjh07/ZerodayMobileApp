// hooks/useQuestions.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Question {
  _dbId: string;
  subject: string;
  chapter: string;
  topic: string;
  difficulty: string;
  year: number;
  shift: string;
  text: string;
  image: string;
  options: { text: string; image?: string }[];
  correct: number;
  answer: string;
  explanation: string;
  explanation_image_url: string;
  type: 'mcq' | 'integer';
}

export function useQuestions(subject: string, chapter: string | null) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subject || !chapter) { setQuestions([]); return; }

    let cancelled = false;
    async function fetch() {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject', subject.toLowerCase())
        .eq('chapter', chapter)
        .eq('exam_type', 'pyq')
        .order('year', { ascending: false });

      if (cancelled) return;
      if (error || !data) { setLoading(false); return; }

      setQuestions(data.map(q => ({
        ...q,
        _dbId: q.id,
        text: q.question_text || '',
        image: q.question_image_url || '',
        options: q.options || [],
        correct: q.type === 'mcq' ? Number(q.correct_answer) : 0,
        answer: q.type === 'integer' ? q.correct_answer : '',
        type: q.type || 'mcq',
      })));
      setLoading(false);
    }
    fetch();
    return () => { cancelled = true; };
  }, [subject, chapter]);

  return { questions, loading };
}
