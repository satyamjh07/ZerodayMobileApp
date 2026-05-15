import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { AppHeader } from '@/components/AppHeader';
import { Lock, Zap, BookOpen, Trophy } from 'lucide-react-native';

export default function SolverIndex() {
  const colors = useColors();
  const router = useRouter();

  const modes = [
    {
      id: 'pyq',
      title: 'PYQ Solver',
      desc: 'Solve chapter-wise Previous Year Questions from JEE Main & Advanced.',
      icon: <Zap size={24} color={colors.primary} />,
      locked: false,
    },
    {
      id: 'booklets',
      title: 'Aura Booklets',
      desc: 'Curated theory and practice sheets for every topic.',
      icon: <BookOpen size={24} color={colors.gold} />,
      locked: true,
    },
    {
      id: 'mock',
      title: 'Mock Tests',
      desc: 'Full-length simulated exams with real-time ranking.',
      icon: <Trophy size={24} color={colors.cyan} />,
      locked: true,
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="SOLVER" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.intro}>
          <Text style={[styles.title, { color: colors.foreground }]}>Choose Mode</Text>
          <Text style={[styles.subtitle, { color: colors.text2 }]}>Select how you want to practice today</Text>
        </View>

        {modes.map((mode) => (
          <TouchableOpacity 
            key={mode.id}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => !mode.locked && router.push('/solver/select')}
            disabled={mode.locked}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.surface2 }]}>
              {mode.icon}
            </View>
            <View style={styles.content}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{mode.title}</Text>
                {mode.locked && <Lock size={14} color={colors.text3} />}
              </View>
              <Text style={[styles.cardDesc, { color: colors.text2 }]}>{mode.desc}</Text>
            </View>
            {!mode.locked && (
              <View style={[styles.arrow, { backgroundColor: colors.primary }]}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  intro: { marginBottom: 24 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, marginTop: 4, fontFamily: 'Inter_400Regular' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  cardDesc: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  arrowText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
