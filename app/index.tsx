import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { FIXED_TAGS, DEFAULT_TAG, COLORS } from '../constants';
import {
  loadRecords,
  loadActiveSession,
  loadCustomTags,
  saveActiveSession,
} from '../storage/storage';
import { ActivityRecord, ActiveSession } from '../types';
import { generateId } from '../utils/id';
import NewActivityModal from '../components/NewActivityModal';
import RecordCard from '../components/RecordCard';

export default function HistoryScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function init() {
        try {
          const session = await loadActiveSession();
          if (cancelled) return;
          if (session) {
            setHasActiveSession(true);
            router.replace('/timer');
            return;
          }
          setHasActiveSession(false);

          const [recs, tags] = await Promise.all([
            loadRecords(),
            loadCustomTags(),
          ]);
          if (cancelled) return;
          setRecords(recs);
          setCustomTags(tags);
          setLoadError(false);
        } catch (e) {
          console.error('HistoryScreen init failed:', e);
          if (!cancelled) {
            setLoadError(true);
            setRecords([]);
          }
        }
      }

      init();
      return () => { cancelled = true; };
    }, []),
  );

  const allTagFilters = ['All', DEFAULT_TAG, ...FIXED_TAGS, ...customTags];

  const filtered = records.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = activeTag === 'All' || r.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  async function handleStartActivity(name: string, tags: string[]) {
    setShowModal(false);
    const now = new Date().toISOString();
    const session: ActiveSession = {
      id: generateId(),
      name,
      tags,
      segments: [],
      notes: null,
      createdAt: now,
      isPaused: false,
      currentSegmentStart: now,
    };
    await saveActiveSession(session);
    router.push('/timer');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {loadError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>Could not load saved data</Text>
        </View>
      )}

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.searchClearBtn}
            >
              <Text style={styles.searchClearText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tag filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagScroll}
        contentContainerStyle={styles.tagScrollContent}
      >
        {allTagFilters.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tagChip, activeTag === tag && styles.tagChipActive]}
            onPress={() => setActiveTag(tag)}
          >
            <Text style={[styles.tagText, activeTag === tag && styles.tagTextActive]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Record list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏱</Text>
            <Text style={styles.emptyText}>No activities yet</Text>
            <Text style={styles.emptySubtext}>
              {hasActiveSession ? 'A session is active — loading...' : 'Tap + to start tracking'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RecordCard
            record={item}
            onPress={() => router.push(`/detail/${item.id}`)}
          />
        )}
      />

      {/* FAB — hidden when a session is active */}
      {!hasActiveSession && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <NewActivityModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onStart={handleStartActivity}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorBanner: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorBannerText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  searchClearBtn: {
    paddingHorizontal: 12,
  },
  searchClearText: {
    color: COLORS.textSecondary,
    fontSize: 20,
    lineHeight: 22,
  },
  tagScroll: {
    maxHeight: 48,
  },
  tagScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagChipActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  tagText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  tagTextActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#000',
    fontSize: 30,
    fontWeight: '400',
    lineHeight: 34,
  },
});
