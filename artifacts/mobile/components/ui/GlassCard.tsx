import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
}

export function GlassCard({ children, style, intensity = 0.7, ...props }: GlassCardProps) {
  const colors = useColors();

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: colors.card,
          borderColor: colors.border,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
});
