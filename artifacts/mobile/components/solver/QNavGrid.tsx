import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface QNavGridProps {
  total: number;
  currentIndex: number;
  onSelect: (index: number) => void;
  attempts: Record<string, { is_correct: boolean }>;
  questionIds: string[];
}

export function QNavGrid({ total, currentIndex, onSelect, attempts, questionIds }: QNavGridProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {Array.from({ length: total }).map((_, i) => {
          const qId = questionIds[i];
          const attempt = attempts[qId];
          const isCurrent = i === currentIndex;
          
          let bg = colors.surface2;
          let border = colors.border;
          let text = colors.text2;

          if (attempt) {
            bg = attempt.is_correct ? colors.green : colors.red;
            border = bg;
            text = '#fff';
          } else if (isCurrent) {
            border = colors.primary;
            text = colors.primary;
          }

          return (
            <TouchableOpacity 
              key={i} 
              style={[styles.dot, { backgroundColor: bg, borderColor: border }]} 
              onPress={() => onSelect(i)}
            >
              <Text style={[styles.dotText, { color: text }]}>{i + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
});
