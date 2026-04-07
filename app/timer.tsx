import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS } from '../constants';
import {
  loadActiveSession,
  saveActiveSession,
  addRecord,
} from '../storage/storage';
import { ActiveSession, ActivityRecord, TimeSegment } from '../types';
import { formatElapsed, formatStartTime, computeTotalDuration } from '../utils/time';
import PostSessionModal from '../components/PostSessionModal';

function computeElapsed(session: ActiveSession): number {
  const completedMs = computeTotalDuration(session.segments);
  if (!session.isPaused && session.currentSegmentStart) {
    return completedMs + (Date.now() - new Date(session.currentSegmentStart).getTime());
  }
  return completedMs;
}

export default function TimerScreen() {
  const router = useRouter();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Load session on focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        try {
          const s = await loadActiveSession();
          if (cancelled) return;
          if (!s) {
            // No active session — go back to history
            router.replace('/');
            return;
          }
          setSession(s);
          setElapsed(computeElapsed(s));
          setLoading(false);
        } catch (e) {
          console.error('TimerScreen load failed:', e);
          if (!cancelled) {
            router.replace('/');
          }
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  // Tick every second
  useEffect(() => {
    if (!session || loading) return;

    function tick() {
      setSession((prev) => {
        if (!prev) return prev;
        setElapsed(computeElapsed(prev));
        return prev;
      });
    }

    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session?.isPaused, loading]);

  // Re-compute elapsed when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          setSession((prev) => {
            if (prev) setElapsed(computeElapsed(prev));
            return prev;
          });
        }
        appStateRef.current = nextState;
      },
    );
    return () => sub.remove();
  }, []);

  async function handlePauseResume() {
    if (!session) return;
    const now = new Date().toISOString();

    let updated: ActiveSession;
    if (!session.isPaused) {
      // Pause: close the current segment
      const newSegment: TimeSegment = {
        start: session.currentSegmentStart!,
        end: now,
      };
      updated = {
        ...session,
        segments: [...session.segments, newSegment],
        isPaused: true,
        currentSegmentStart: null,
      };
    } else {
      // Resume: open a new segment
      updated = {
        ...session,
        isPaused: false,
        currentSegmentStart: now,
      };
    }

    setSession(updated);
    await saveActiveSession(updated);
  }

  async function handleStop() {
    if (!session) return;
    const now = new Date().toISOString();

    // Finalize last segment if still running
    let finalSegments = [...session.segments];
    if (!session.isPaused && session.currentSegmentStart) {
      finalSegments.push({ start: session.currentSegmentStart, end: now });
    }

    const totalDuration = finalSegments.reduce((acc, seg) => {
      return acc + (new Date(seg.end).getTime() - new Date(seg.start).getTime());
    }, 0);

    // Store finalized session in state for the post modal
    const finalized: ActiveSession = {
      ...session,
      segments: finalSegments,
      isPaused: true,
      currentSegmentStart: null,
    };
    setSession(finalized);
    await saveActiveSession(finalized);

    if (intervalRef.current) clearInterval(intervalRef.current);

    setShowPostModal(true);
  }

  async function saveAndNavigate(notes: string | null) {
    if (!session) return;

    const finalSegments = session.segments;
    const totalDuration = finalSegments.reduce((acc, seg) => {
      return acc + (new Date(seg.end).getTime() - new Date(seg.start).getTime());
    }, 0);

    const record: ActivityRecord = {
      id: session.id,
      name: session.name,
      tags: session.tags,
      segments: finalSegments,
      totalDuration,
      notes,
      createdAt: session.createdAt,
    };

    await addRecord(record);
    await saveActiveSession(null); // clear active session

    setShowPostModal(false);
    router.replace('/');
  }

  if (loading || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading session...</Text>
      </SafeAreaView>
    );
  }

  const isPaused = session.isPaused;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header info */}
      <View style={styles.header}>
        <Text style={styles.activityName} numberOfLines={2}>
          {session.name}
        </Text>
        <View style={styles.tagsRow}>
          {session.tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.startedAt}>
          Started: {formatStartTime(session.createdAt)}
        </Text>
      </View>

      {/* Timer display */}
      <View style={styles.timerContainer}>
        <Text style={[styles.timerDigits, isPaused && styles.timerPaused]}>
          {formatElapsed(elapsed)}
        </Text>
        {isPaused && (
          <Text style={styles.pausedLabel}>PAUSED</Text>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.pauseBtn, isPaused && styles.resumeBtn]}
          onPress={handlePauseResume}
          activeOpacity={0.8}
        >
          <Text style={styles.pauseBtnText}>
            {isPaused ? 'Resume' : 'Pause'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopBtn}
          onPress={handleStop}
          activeOpacity={0.8}
        >
          <Text style={styles.stopBtnText}>Stop</Text>
        </TouchableOpacity>
      </View>

      <PostSessionModal
        visible={showPostModal}
        onSave={(notes) => saveAndNavigate(notes)}
        onSkip={() => saveAndNavigate(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  loadingText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 10,
  },
  activityName: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  tagText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  startedAt: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  timerDigits: {
    color: COLORS.accent,
    fontSize: 72,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: 4,
  },
  timerPaused: {
    color: COLORS.textSecondary,
  },
  pausedLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 12,
  },
  controls: {
    paddingHorizontal: 24,
    gap: 12,
  },
  pauseBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resumeBtn: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  pauseBtnText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
  },
  stopBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  stopBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
