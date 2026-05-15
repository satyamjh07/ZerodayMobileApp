import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { MathText } from './MathText';

interface OptionButtonProps {
  index: number;
  text: string;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function OptionButton({ 
  index, 
  text, 
  isSelected, 
  isCorrect, 
  isWrong, 
  onPress,
  disabled 
}: OptionButtonProps) {
  const colors = useColors();
  
  const label = String.fromCharCode(65 + index);
  
  const getColors = () => {
    if (isCorrect) return { bg: 'rgba(34, 197, 94, 0.1)', border: colors.green, tint: colors.green };
    if (isWrong) return { bg: 'rgba(239, 68, 68, 0.1)', border: colors.red, tint: colors.red };
    if (isSelected) return { bg: 'rgba(124, 58, 237, 0.1)', border: colors.primary, tint: colors.primary };
    return { bg: colors.surface2, border: colors.border, tint: colors.text2 };
  };

  const c = getColors();

  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: c.bg, borderColor: c.border }]} 
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.labelWrap, { backgroundColor: isSelected || isCorrect || isWrong ? c.tint : colors.background, borderColor: c.border }]}>
        <Text style={[styles.labelText, { color: isSelected || isCorrect || isWrong ? '#fff' : colors.text2 }]}>{label}</Text>
      </View>
      <View style={styles.textWrap}>
        <MathText text={text} fontSize={14} color={isCorrect || isWrong || isSelected ? '#fff' : colors.text} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  labelWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  labelText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  textWrap: {
    flex: 1,
  }
});
