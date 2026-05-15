import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { AppHeader } from '@/components/AppHeader';
import { ChevronLeft, FlaskConical, Atom, Binary } from 'lucide-react-native';

const SUBJECTS = [
  { id: 'physics', label: 'Physics', icon: <FlaskConical size={18} /> },
  { id: 'chemistry', label: 'Chemistry', icon: <Atom size={18} /> },
  { id: 'mathematics', label: 'Mathematics', icon: <Binary size={18} /> },
];

const CHAPTERS: Record<string, string[]> = {
  physics: ['Kinematics', 'Laws of Motion', 'Work, Energy and Power', 'Rotational Motion', 'Gravitation', 'Thermodynamics', 'Electrostatics', 'Current Electricity', 'Optics', 'Modern Physics'],
  chemistry: ['Some Basic Concepts', 'Atomic Structure', 'Chemical Bonding', 'Equilibrium', 'Redox Reactions', 'p-Block Elements', 'Organic Chemistry Basics', 'Hydrocarbons', 'Solutions', 'Kinetics'],
  mathematics: ['Sets and Relations', 'Complex Numbers', 'Quadratic Equations', 'Matrices and Determinants', 'Permutations and Combinations', 'Trigonometry', 'Calculus', 'Vectors and 3D Geometry', 'Probability', 'Coordinate Geometry'],
};

export default function SolverSelect() {
  const colors = useColors();
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState('physics');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.nav, { paddingTop: 60 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Select Chapter</Text>
      </View>

      <View style={styles.subjectTabs}>
        {SUBJECTS.map((sub) => {
          const active = selectedSubject === sub.id;
          return (
            <TouchableOpacity 
              key={sub.id}
              onPress={() => setSelectedSubject(sub.id)}
              style={[styles.tab, { backgroundColor: active ? colors.primary : colors.surface2 }]}
            >
              <Text style={{ color: active ? '#fff' : colors.text2 }}>{sub.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {CHAPTERS[selectedSubject].map((chapter) => (
          <TouchableOpacity 
            key={chapter}
            style={[styles.chapterCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/solver/[chapter]', params: { chapter, subject: selectedSubject } })}
          >
            <View>
              <Text style={[styles.chapterName, { color: colors.foreground }]}>{chapter}</Text>
              <Text style={[styles.chapterMeta, { color: colors.text3 }]}>Chapter-wise PYQs</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.countText, { color: colors.primary }]}>GO</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  backBtn: { marginRight: 16 },
  navTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  subjectTabs: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  chapterName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  chapterMeta: { fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  countBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  countText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
});
