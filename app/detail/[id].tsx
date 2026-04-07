import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { FIXED_TAGS, DEFAULT_TAG, COLORS } from '../../constants';
import {
  loadRecords,
  updateRecord,
  deleteRecord,
  loadCustomTags,
  saveCustomTags,
  deleteCustomTag,
} from '../../storage/storage';
import { ActivityRecord, TimeSegment } from '../../types';
import Toast from '../../components/Toast';

function computeTotalDuration(segments: TimeSegment[]): number {
  return segments.reduce((acc, seg) => {
    return acc + (new Date(seg.end).getTime() - new Date(seg.start).getTime());
  }, 0);
}

function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// 24-hour format for edit fields (HH:MM)
function formatSegmentTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// 12-hour format with AM/PM for display only
function formatSegmentTimeDisplay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Parse HH:MM or HH:MM:SS into a Date. Handles cross-midnight: if parsed end < start, adds 1 day.
function parseTimeInput(value: string, referenceDate: Date): Date | null {
  const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const s = match[3] ? parseInt(match[3], 10) : 0;
  if (h > 23 || m > 59 || s > 59) return null;
  const d = new Date(referenceDate);
  d.setHours(h, m, s, 0);
  return d;
}

// Same as above but advances by 1 day if result is before startDate (cross-midnight)
function parseEndTimeInput(value: string, referenceDate: Date, startDate: Date): Date | null {
  const parsed = parseTimeInput(value, referenceDate);
  if (!parsed) return null;
  if (parsed <= startDate) {
    parsed.setDate(parsed.getDate() + 1);
  }
  return parsed;
}

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [record, setRecord] = useState<ActivityRecord | null>(null);
  const [name, setName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Time editing
  const [firstStartInput, setFirstStartInput] = useState('');
  const [lastEndInput, setLastEndInput] = useState('');
  const [timeError, setTimeError] = useState('');
  // Preview duration shown in the Total badge; updates on valid blur
  const [previewDuration, setPreviewDuration] = useState(0);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
  }

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        try {
          const [records, cTags] = await Promise.all([
            loadRecords(),
            loadCustomTags(),
          ]);
          if (cancelled) return;
          const found = records.find((r) => r.id === id);
          if (!found) {
            setNotFound(true);
            setLoading(false);
            return;
          }
          setRecord(found);
          setName(found.name);
          setTags(found.tags);
          setNotes(found.notes ?? '');
          setCustomTags(cTags);
          setPreviewDuration(found.totalDuration);
          if (found.segments.length > 0) {
            setFirstStartInput(formatSegmentTime(found.segments[0].start));
            setLastEndInput(
              formatSegmentTime(found.segments[found.segments.length - 1].end),
            );
          }
          setLoadError(false);
          setLoading(false);
        } catch (e) {
          console.error('DetailScreen load failed:', e);
          if (!cancelled) {
            setLoadError(true);
            setLoading(false);
          }
        }
      }

      load();
      return () => { cancelled = true; };
    }, [id]),
  );

  const allTags = [DEFAULT_TAG, ...FIXED_TAGS, ...customTags];

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function handleAddCustomTag() {
    const trimmed = customTagInput.trim();
    if (!trimmed || allTags.includes(trimmed)) {
      setCustomTagInput('');
      return;
    }
    const updated = [...customTags, trimmed];
    setCustomTags(updated);
    saveCustomTags(updated);
    setTags((prev) => [...prev, trimmed]);
    setCustomTagInput('');
  }

  async function handleDeleteCustomTag(tag: string) {
    await deleteCustomTag(tag);
    setCustomTags((prev) => prev.filter((t) => t !== tag));
  }

  // Called on blur from either time input — validates and updates preview duration
  function handleTimeBlur() {
    if (!record || record.segments.length === 0) return;

    const refStart = new Date(record.segments[0].start);
    const refEnd = new Date(record.segments[record.segments.length - 1].end);

    const newStart = parseTimeInput(firstStartInput, refStart);
    if (!newStart) {
      setTimeError('Invalid start time. Use HH:MM (24h).');
      return;
    }

    const newEnd = parseEndTimeInput(lastEndInput, refEnd, newStart);
    if (!newEnd) {
      setTimeError('Invalid end time. Use HH:MM (24h).');
      return;
    }

    if (newStart >= newEnd) {
      setTimeError('Start time must be before end time.');
      return;
    }

    // Valid — update preview duration
    setTimeError('');
    let updatedSegments = [...record.segments];
    if (updatedSegments.length === 1) {
      updatedSegments[0] = { start: newStart.toISOString(), end: newEnd.toISOString() };
    } else {
      updatedSegments = updatedSegments.map((seg, i) => {
        if (i === 0) return { ...seg, start: newStart.toISOString() };
        if (i === updatedSegments.length - 1) return { ...seg, end: newEnd.toISOString() };
        return seg;
      });
    }
    setPreviewDuration(computeTotalDuration(updatedSegments));
  }

  async function handleSave() {
    if (!record) return;

    // Tag validation: auto-assign Default if none selected
    let finalTags = tags;
    if (finalTags.length === 0) {
      finalTags = [DEFAULT_TAG];
      setTags([DEFAULT_TAG]);
      showToast('No tag selected — Default tag assigned');
    }

    // Time validation (same logic as blur, re-run to block save if still invalid)
    let updatedSegments = [...record.segments];
    if (record.segments.length > 0) {
      const refStart = new Date(record.segments[0].start);
      const refEnd = new Date(record.segments[record.segments.length - 1].end);

      const newStart = parseTimeInput(firstStartInput, refStart);
      if (!newStart) { setTimeError('Invalid start time. Use HH:MM (24h).'); return; }

      const newEnd = parseEndTimeInput(lastEndInput, refEnd, newStart);
      if (!newEnd) { setTimeError('Invalid end time. Use HH:MM (24h).'); return; }

      if (newStart >= newEnd) { setTimeError('Start time must be before end time.'); return; }

      setTimeError('');
      if (updatedSegments.length === 1) {
        updatedSegments[0] = { start: newStart.toISOString(), end: newEnd.toISOString() };
      } else {
        updatedSegments = updatedSegments.map((seg, i) => {
          if (i === 0) return { ...seg, start: newStart.toISOString() };
          if (i === updatedSegments.length - 1) return { ...seg, end: newEnd.toISOString() };
          return seg;
        });
      }
    }

    const totalDuration = computeTotalDuration(updatedSegments);

    const updated: ActivityRecord = {
      ...record,
      name: name.trim() || record.name,
      tags: finalTags,
      notes: notes.trim() || null,
      segments: updatedSegments,
      totalDuration,
    };

    try {
      await updateRecord(updated);
      setRecord(updated);
      setPreviewDuration(totalDuration);
      Alert.alert('Saved', 'Changes saved successfully.');
    } catch (e) {
      Alert.alert('Save Failed', 'Could not save changes. Please try again.');
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this activity record? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!record) return;
            try {
              await deleteRecord(record.id);
              router.replace('/');
            } catch (e) {
              Alert.alert('Delete Failed', 'Could not delete record. Please try again.');
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.statusText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.statusText}>Could not load record.</Text>
        <Text style={styles.statusSubtext}>Check your storage and try again.</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (notFound || !record) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.statusText}>Record not found.</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Total duration — updates live on valid blur */}
        <View style={styles.durationBadge}>
          <Text style={styles.durationLabel}>Total</Text>
          <Text style={styles.durationValue}>
            {formatDurationMs(previewDuration)}
          </Text>
        </View>

        {/* Name */}
        <Text style={styles.label}>Activity Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Activity name"
          placeholderTextColor={COLORS.textSecondary}
          returnKeyType="done"
        />

        {/* Tags */}
        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagContainer}>
          {/* Default tag — non-deletable */}
          <TouchableOpacity
            key={DEFAULT_TAG}
            style={[styles.tagChip, tags.includes(DEFAULT_TAG) && styles.tagChipActive]}
            onPress={() => toggleTag(DEFAULT_TAG)}
          >
            <Text style={[styles.tagText, tags.includes(DEFAULT_TAG) && styles.tagTextActive]}>
              {DEFAULT_TAG}
            </Text>
          </TouchableOpacity>

          {/* Fixed tags — non-deletable */}
          {FIXED_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagChip, tags.includes(tag) && styles.tagChipActive]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.tagText, tags.includes(tag) && styles.tagTextActive]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Custom tags — deletable */}
          {customTags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tagChip,
                tags.includes(tag) && styles.tagChipActive,
                styles.tagChipCustom,
              ]}
            >
              <TouchableOpacity onPress={() => toggleTag(tag)}>
                <Text style={[styles.tagText, tags.includes(tag) && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteCustomTag(tag)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.deleteTagText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={styles.customTagRow}>
          <TextInput
            style={[styles.input, styles.customTagInput]}
            placeholder="Add custom tag..."
            placeholderTextColor={COLORS.textSecondary}
            value={customTagInput}
            onChangeText={setCustomTagInput}
            onSubmitEditing={handleAddCustomTag}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addTagBtn} onPress={handleAddCustomTag}>
            <Text style={styles.addTagBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Time segments */}
        {record.segments.length > 0 && (
          <>
            <Text style={styles.label}>Time Segments</Text>
            <View style={styles.segmentsCard}>
              {record.segments.map((seg, i) => (
                <View key={i} style={styles.segmentRow}>
                  <Text style={styles.segmentIndex}>{i + 1}</Text>
                  <Text style={styles.segmentTime}>
                    {formatSegmentTimeDisplay(seg.start)} – {formatSegmentTimeDisplay(seg.end)}
                  </Text>
                  <Text style={styles.segmentDuration}>
                    {formatDurationMs(
                      new Date(seg.end).getTime() - new Date(seg.start).getTime(),
                    )}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.label}>Edit Start / End Times (HH:MM, 24h)</Text>
            <View style={styles.timeEditRow}>
              <View style={styles.timeEditField}>
                <Text style={styles.timeEditHint}>First start</Text>
                <TextInput
                  style={[styles.input, styles.timeInput, !!timeError && styles.inputError]}
                  value={firstStartInput}
                  onChangeText={setFirstStartInput}
                  onBlur={handleTimeBlur}
                  placeholder="HH:MM"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                />
              </View>
              <View style={styles.timeEditField}>
                <Text style={styles.timeEditHint}>Last end</Text>
                <TextInput
                  style={[styles.input, styles.timeInput, !!timeError && styles.inputError]}
                  value={lastEndInput}
                  onChangeText={setLastEndInput}
                  onBlur={handleTimeBlur}
                  placeholder="HH:MM"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                />
              </View>
            </View>
            {!!timeError && (
              <Text style={styles.errorText}>{timeError}</Text>
            )}
          </>
        )}

        {/* Notes */}
        <Text style={styles.label}>Journal Note</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="How did it go? (optional)"
          placeholderTextColor={COLORS.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete Record</Text>
        </TouchableOpacity>
      </ScrollView>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    gap: 4,
  },
  statusText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 60,
    fontSize: 15,
  },
  statusSubtext: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    fontSize: 13,
  },
  backLink: {
    color: COLORS.accent,
    textAlign: 'center',
    marginTop: 12,
    fontSize: 15,
  },
  durationBadge: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  durationLabel: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  durationValue: {
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagChipActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  tagChipCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  deleteTagText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 18,
  },
  customTagRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  customTagInput: {
    flex: 1,
    marginBottom: 0,
  },
  addTagBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addTagBtnText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    marginBottom: 4,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  segmentIndex: {
    color: COLORS.textSecondary,
    fontSize: 12,
    width: 16,
    textAlign: 'center',
  },
  segmentTime: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  segmentDuration: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  timeEditRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeEditField: {
    flex: 1,
  },
  timeEditHint: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  timeInput: {
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  deleteBtnText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});
