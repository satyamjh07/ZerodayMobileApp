import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { MathText } from './MathText';

interface ExplanationBoxProps {
  text: string;
  imageUrl?: string;
}

export function ExplanationBox({ text, imageUrl }: ExplanationBoxProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.2)' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.green }]}>⚡ SOLUTION</Text>
      </View>
      <MathText text={text} fontSize={13} color={colors.text} />
      {imageUrl && (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image} 
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  header: {
    marginBottom: 8,
  },
  headerText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
