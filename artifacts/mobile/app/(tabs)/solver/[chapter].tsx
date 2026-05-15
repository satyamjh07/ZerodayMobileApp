import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { supabase } from '@/lib/supabase';
import { useQuestions } from '@/hooks/useQuestions';
import { useAttempts } from '@/hooks/useAttempts';
import { ChevronLeft, Flag } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { QNavGrid } from '@/components/solver/QNavGrid';
import { MathText } from '@/components/solver/MathText';
import { OptionButton } from '@/components/solver/OptionButton';
import { ExplanationBox } from '@/components/solver/ExplanationBox';

export default function SolverSession() {
  const { chapter, subject } = useLocalSearchParams<{ chapter: string; subject: string }>();
  const colors = useColors();
  const router = useRouter();

  // 1. Data Fetching
  const { questions, loading: qLoading } = useQuestions(subject, chapter);
  const qIds = useMemo(() => questions.map(q => q._dbId), [questions]);
  const { attempts: fetchedAttempts, loading: aLoading } = useAttempts(qIds);

  // 2. State & Refs
  const [currentIndex, setCurrentIndex] = useState(0);
  const attemptCacheRef = useRef<Record<string, any>>({});
  const [localAttempts, setLocalAttempts] = useState<Record<string, any>>({});

  // Sync fetched attempts into local state (merge, local wins)
  useEffect(() => {
    if (Object.keys(fetchedAttempts).length > 0) {
      setLocalAttempts(prev => ({ ...fetchedAttempts, ...prev }));
    }
  }, [fetchedAttempts]);

  const currentQuestion = questions[currentIndex];
  const qId = currentQuestion?._dbId;
  const currentAttempt = localAttempts[qId];

  // 3. Actions
  const handleSelect = async (optionIdx: number) => {
    if (currentAttempt || !currentQuestion) return;

    const isCorrect = (optionIdx + 1) === currentQuestion.correct;
    const newAttempt = {
      question_id: qId,
      selected_answer: String(optionIdx + 1),
      is_correct: isCorrect,
      created_at: new Date().toISOString(),
    };

    // a. Instant UI Update
    attemptCacheRef.current[qId] = newAttempt;
    setLocalAttempts(prev => ({ ...prev, [qId]: newAttempt }));

    // b. Fire-and-forget DB Save
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      supabase
        .from('user_attempts')
        .insert([{
          user_id: user.id,
          question_id: qId,
          selected_answer: newAttempt.selected_answer,
          is_correct: isCorrect,
        }])
        .then(({ error }) => {
          if (error) console.error('Save failed:', error);
        });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      Alert.alert('Session Complete', 'You have finished all questions in this chapter!');
      router.back();
    }
  };

  if (qLoading || aLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text2 }}>No questions found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 60 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={[styles.chapterLabel, { color: colors.text2 }]}>{chapter.toUpperCase()}</Text>
          <Text style={[styles.subjectLabel, { color: colors.text3 }]}>{subject.toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Flag size={20} color={colors.text3} />
        </TouchableOpacity>
      </View>

      {/* Nav Grid */}
      <QNavGrid 
        total={questions.length} 
        currentIndex={currentIndex} 
        onSelect={setCurrentIndex} 
        attempts={localAttempts}
        questionIds={qIds}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Metadata */}
        <View style={styles.meta}>
          <Badge label={currentQuestion.difficulty} type="difficulty" difficulty={currentQuestion.difficulty as any} />
          <Badge label={`${currentQuestion.year}`} />
          {currentQuestion.shift && <Badge label={currentQuestion.shift} />}
        </View>

        {/* Question Content */}
        <View style={styles.questionBox}>
          <MathText text={currentQuestion.text} fontSize={16} />
          {currentQuestion.image && (
            <Image source={{ uri: currentQuestion.image }} style={styles.qImage} resizeMode="contain" />
          )}
        </View>

        {/* Options */}
        <View style={styles.optionsWrap}>
          {currentQuestion.options.map((opt, i) => {
            const isSelected = currentAttempt?.selected_answer === String(i + 1);
            const isCorrect = currentAttempt && (i + 1) === currentQuestion.correct;
            const isWrong = currentAttempt && isSelected && !isCorrect;

            return (
              <OptionButton
                key={i}
                index={i}
                text={opt.text}
                isSelected={isSelected}
                isCorrect={!!isCorrect}
                isWrong={!!isWrong}
                onPress={() => handleSelect(i)}
                disabled={!!currentAttempt}
              />
            );
          })}
        </View>

        {/* Explanation */}
        {currentAttempt && (
          <View style={{ marginBottom: 40 }}>
            <ExplanationBox 
              text={currentQuestion.explanation} 
              imageUrl={currentQuestion.explanation_image_url} 
            />
            <TouchableOpacity 
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              onPress={handleNext}
            >
              <Text style={styles.nextBtnText}>Next Question</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { alignItems: 'center' },
  chapterLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  subjectLabel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  scroll: { padding: 20 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  questionBox: { marginBottom: 24 },
  qImage: { width: '100%', height: 200, marginTop: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  optionsWrap: { gap: 10 },
  nextBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
