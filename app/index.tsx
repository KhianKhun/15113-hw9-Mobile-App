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
import { FIXED_TAGS, COLORS } from '../constants';
import {
  loadRecords,
  loadActiveSession,
  loadCustomTags,
  saveActiveSession,
} from '../storage/storage';
import { ActivityRecord, ActiveSession } from '../types';
import NewActivityModal from '../components/NewActivityModal';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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
          // If there is an active session, redirect straight to timer
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
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const allTagFilters = ['All', ...FIXED_TAGS, ...customTags];

  const filtered = records.filter((r) => {
    const matchesSearch = r.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTag =
      activeTag === 'All' || r.tags.includes(activeTag);
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
          <Text style={styles.errorBannerText}>
            Could not load saved data
          </Text>
        </View>
      )}

      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search activities..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
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
            style={[
              styles.tagChip,
              activeTag === tag && styles.tagChipActive,
            ]}
            onPress={() => setActiveTag(tag)}
          >
            <Text
              style={[
                styles.tagText,
                activeTag === tag && styles.tagTextActive,
              ]}
            >
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
              {hasActiveSession
                ? 'A session is active — loading...'
                : 'Tap + to start tracking'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/detail/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cardDuration}>
                {formatDuration(item.totalDuration)}
              </Text>
            </View>
            <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
            <View style={styles.cardTags}>
              {item.tags.map((tag) => (
                <View key={tag} style={styles.cardTag}>
                  <Text style={styles.cardTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
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
  searchInput: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  cardDuration: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  cardDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 10,
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTagText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
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
