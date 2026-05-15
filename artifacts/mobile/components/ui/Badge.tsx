import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface BadgeProps {
  label: string;
  type?: 'default' | 'difficulty' | 'year' | 'accent';
  difficulty?: 'easy' | 'medium' | 'hard';
}

export function Badge({ label, type = 'default', difficulty }: BadgeProps) {
  const colors = useColors();

  const getStyles = () => {
    if (type === 'difficulty' && difficulty) {
      switch (difficulty) {
        case 'hard': return { bg: 'rgba(231,76,60,0.1)', border: colors.red, text: colors.red };
        case 'medium': return { bg: 'rgba(243,156,18,0.1)', border: colors.orange, text: colors.orange };
        case 'easy': return { bg: 'rgba(39,174,96,0.1)', border: colors.green, text: colors.green };
      }
    }
    if (type === 'accent') return { bg: 'rgba(124, 58, 237, 0.15)', border: 'rgba(124, 58, 237, 0.3)', text: colors.primary };
    return { bg: colors.surface2, border: colors.border, text: colors.text2 };
  };

  const s = getStyles();

  return (
    <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.text, { color: s.text }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  text: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
});
