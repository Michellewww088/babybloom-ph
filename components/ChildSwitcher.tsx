/**
 * ChildSwitcher.tsx
 * Horizontal scrollable child selector for the Dashboard top bar.
 * - No children   → "Add your first baby" prompt
 * - 1+ children   → avatar chips with active highlight
 * - "+" button    → navigate to /child-profile (max 5)
 * - Long-press on avatar → edit that child's profile
 */

import {
  View, Text, TouchableOpacity, ScrollView,
  Image, StyleSheet, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Colors from '../constants/Colors';
import { useChildStore, Child, getChildDisplayName, getChildAge } from '../store/childStore';

const MAX_CHILDREN = 5;

/** Coloured circle avatar (when no photo) */
const DEFAULT_AVATAR_BG = [
  Colors.softBlue,
  Colors.softPink,
  Colors.softMint,
  Colors.softGold,
];
const DEFAULT_AVATAR_EMOJI = ['👶🏻', '👶🏽', '👶🏾', '👶'];

function AvatarCircle({ child, size = 44 }: { child: Child; size?: number }) {
  const bgColor = DEFAULT_AVATAR_BG[(child.avatarIndex ?? 0) % DEFAULT_AVATAR_BG.length];
  const emoji   = DEFAULT_AVATAR_EMOJI[(child.avatarIndex ?? 0) % DEFAULT_AVATAR_EMOJI.length];

  if (child.photoUri) {
    return (
      <Image
        source={{ uri: child.photoUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.44 }}>{emoji}</Text>
    </View>
  );
}

export default function ChildSwitcher() {
  const { t } = useTranslation();
  const { children, activeChild, setActiveChild } = useChildStore();

  const handleAddChild = () => {
    if (children.length >= MAX_CHILDREN) {
      Alert.alert('', t('switcher.max_children'));
      return;
    }
    router.push('/child-profile');
  };

  const handleSelectChild = (child: Child) => {
    setActiveChild(child);
  };

  const handleEditChild = (child: Child) => {
    router.push({ pathname: '/child-profile', params: { id: child.id } });
  };

  // ── Empty state ──────────────────────────────────────────────────────────

  if (children.length === 0) {
    return (
      <TouchableOpacity style={s.emptyContainer} onPress={handleAddChild} activeOpacity={0.75}>
        <View style={s.addBtnLarge}>
          <Text style={s.addBtnLargeIcon}>+</Text>
        </View>
        <Text style={s.emptyText}>{t('switcher.no_children')}</Text>
      </TouchableOpacity>
    );
  }

  // ── Switcher row ─────────────────────────────────────────────────────────

  return (
    <View style={s.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Child chips */}
        {children.map((child) => {
          const isActive = activeChild?.id === child.id;
          return (
            <TouchableOpacity
              key={child.id}
              style={[s.childChip, isActive && s.childChipActive]}
              onPress={() => handleSelectChild(child)}
              onLongPress={() => handleEditChild(child)}
              activeOpacity={0.8}
            >
              <View style={[s.avatarWrapper, isActive && s.avatarWrapperActive]}>
                <AvatarCircle child={child} size={40} />
              </View>
              <Text
                style={[s.childName, isActive && s.childNameActive]}
                numberOfLines={1}
              >
                {getChildDisplayName(child)}
              </Text>
              {child.birthday && (
                <Text style={s.childAge}>{getChildAge(child.birthday)}</Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Add button (only if < max) */}
        {children.length < MAX_CHILDREN && (
          <TouchableOpacity style={s.addChip} onPress={handleAddChild} activeOpacity={0.75}>
            <View style={s.addCircle}>
              <Text style={s.addIcon}>+</Text>
            </View>
            <Text style={s.addLabel}>{t('switcher.add_child')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    backgroundColor: '#FFF0F4',
    borderBottomWidth: 1,
    borderBottomColor: '#FCE4EC',
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'flex-start',
  },

  // Child chip
  childChip: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: 64,
    maxWidth: 80,
  },
  childChipActive: {
    borderColor: Colors.primaryPink,
    backgroundColor: Colors.softPink,
  },
  avatarWrapper: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  avatarWrapperActive: {
    borderColor: Colors.primaryPink,
  },
  childName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.midGray,
    textAlign: 'center',
  },
  childNameActive: { color: Colors.primaryPink },
  childAge: {
    fontSize: 10,
    color: Colors.lightGray,
    textAlign: 'center',
  },

  // Add chip
  addChip: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 60,
  },
  addCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primaryPink,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: Colors.softPink,
  },
  addIcon: { fontSize: 22, color: Colors.primaryPink, fontWeight: '300', lineHeight: 26 },
  addLabel: { fontSize: 11, color: Colors.primaryPink, fontWeight: '600' },

  // Empty state
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.softPink,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primaryPink,
    borderStyle: 'dashed',
    gap: 12,
  },
  addBtnLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnLargeIcon: { fontSize: 26, color: Colors.white, fontWeight: '300', lineHeight: 30 },
  emptyText: { fontSize: 14, fontWeight: '600', color: Colors.primaryPink, flex: 1 },
});
