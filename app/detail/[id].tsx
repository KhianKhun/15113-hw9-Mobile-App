import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert, // kept for delete confirmation dialog
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { DEFAULT_TAG, COLORS } from '../../constants';
import {
  loadRecords,
  updateRecord,
  deleteRecord,
  loadCustomTags,
  saveCustomTags,
  deleteCustomTag,
} from '../../storage/storage';
import { ActivityRecord } from '../../types';
import {
  formatDurationFull,
  formatSegmentTime,
  formatDateInput,
  parseTimeInput,
  parseDateInput,
  computeTotalDuration,
  applyTimeEdits,
} from '../../utils/time';
import TagSelector from '../../components/TagSelector';
import TimeEditor from '../../components/TimeEditor';
import Toast from '../../components/Toast';

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
  const [previewDuration, setPreviewDuration] = useState(0);

  // Date editing
  const [firstStartDateInput, setFirstStartDateInput] = useState('');
  const [lastEndDateInput, setLastEndDateInput] = useState('');
  const [dateError, setDateError] = useState('');

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');

  function showToast(msg: string, type: 'info' | 'success' | 'error' = 'info') {
    setToastMessage(msg);
    setToastType(type);
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
            setLastEndInput(formatSegmentTime(found.segments[found.segments.length - 1].end));
            setFirstStartDateInput(formatDateInput(found.segments[0].start));
            setLastEndDateInput(formatDateInput(found.segments[found.segments.length - 1].end));
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

  // ─── Tag handlers ────────────────────────────────────────────────────────────

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  function handleAddCustomTag() {
    const trimmed = customTagInput.trim();
    const allTags = [DEFAULT_TAG, ...customTags];
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

  // ─── Date blur validation ────────────────────────────────────────────────────

  function handleDateBlur() {
    if (!record || record.segments.length === 0) return;

    const startDate = parseDateInput(firstStartDateInput);
    if (!startDate) { setDateError('Invalid start date. Use YYYY-MM-DD.'); return; }

    const endDate = parseDateInput(lastEndDateInput);
    if (!endDate) { setDateError('Invalid end date. Use YYYY-MM-DD.'); return; }

    setDateError('');
    // Re-run time validation with updated dates
    handleTimeBlurWithDates(startDate, endDate);
  }

  // ─── Time blur validation ────────────────────────────────────────────────────

  function handleTimeBlurWithDates(startDate: Date, endDate: Date) {
    const newStart = parseTimeInput(firstStartInput, startDate);
    if (!newStart) { setTimeError('Invalid start time. Use HH:MM (24h).'); return; }

    let newEnd = parseTimeInput(lastEndInput, endDate);
    if (!newEnd) { setTimeError('Invalid end time. Use HH:MM (24h).'); return; }

    // Midnight-crossing: advance end date by 1 day and update input
    if (newEnd <= newStart) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setLastEndDateInput(formatDateInput(nextDay.toISOString()));
      newEnd = parseTimeInput(lastEndInput, nextDay)!;
    }

    if (newStart >= newEnd) { setTimeError('Start time must be before end time.'); return; }

    setTimeError('');
    const updatedSegments = applyTimeEdits(record!.segments, newStart, newEnd);
    setPreviewDuration(computeTotalDuration(updatedSegments));
  }

  function handleTimeBlur() {
    if (!record || record.segments.length === 0) return;

    const startDate = parseDateInput(firstStartDateInput);
    if (!startDate) { setDateError('Invalid start date. Use YYYY-MM-DD.'); return; }

    const endDate = parseDateInput(lastEndDateInput);
    if (!endDate) { setDateError('Invalid end date. Use YYYY-MM-DD.'); return; }

    handleTimeBlurWithDates(startDate, endDate);
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!record) return;

    let finalTags = tags;
    if (finalTags.length === 0) {
      finalTags = [DEFAULT_TAG];
      setTags([DEFAULT_TAG]);
      showToast('No tag selected — Default tag assigned');
    }

    let updatedSegments = [...record.segments];
    if (record.segments.length > 0) {
      const startDate = parseDateInput(firstStartDateInput);
      if (!startDate) { setDateError('Invalid start date. Use YYYY-MM-DD.'); return; }

      const endDate = parseDateInput(lastEndDateInput);
      if (!endDate) { setDateError('Invalid end date. Use YYYY-MM-DD.'); return; }

      setDateError('');

      const newStart = parseTimeInput(firstStartInput, startDate);
      if (!newStart) { setTimeError('Invalid start time. Use HH:MM (24h).'); return; }

      let newEnd = parseTimeInput(lastEndInput, endDate);
      if (!newEnd) { setTimeError('Invalid end time. Use HH:MM (24h).'); return; }

      if (newEnd <= newStart) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setLastEndDateInput(formatDateInput(nextDay.toISOString()));
        newEnd = parseTimeInput(lastEndInput, nextDay)!;
      }

      if (newStart >= newEnd) { setTimeError('Start time must be before end time.'); return; }

      setTimeError('');
      updatedSegments = applyTimeEdits(record.segments, newStart, newEnd);
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
      showToast('Changes saved successfully', 'success');
    } catch (e) {
      showToast('Could not save changes. Please try again.', 'error');
    }
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

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
              showToast('Could not delete record. Please try again.', 'error');
            }
          },
        },
      ],
    );
  }

  // ─── Render guards ───────────────────────────────────────────────────────────

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

  // ─── Main render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Total duration — updates live on valid blur */}
        <View style={styles.durationBadge}>
          <Text style={styles.durationLabel}>Total</Text>
          <Text style={styles.durationValue}>{formatDurationFull(previewDuration)}</Text>
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
        <TagSelector
          selectedTags={tags}
          onToggle={toggleTag}
          customTags={customTags}
          onDeleteCustomTag={handleDeleteCustomTag}
          customTagInput={customTagInput}
          onCustomTagInputChange={setCustomTagInput}
          onAddCustomTag={handleAddCustomTag}
        />

        {/* Time segments */}
        {record.segments.length > 0 && (
          <>
            <Text style={styles.label}>Time Segments</Text>
            <TimeEditor
              segments={record.segments}
              firstStartInput={firstStartInput}
              lastEndInput={lastEndInput}
              onFirstStartChange={setFirstStartInput}
              onLastEndChange={setLastEndInput}
              onBlur={handleTimeBlur}
              timeError={timeError}
              firstStartDateInput={firstStartDateInput}
              lastEndDateInput={lastEndDateInput}
              onFirstStartDateChange={setFirstStartDateInput}
              onLastEndDateChange={setLastEndDateInput}
              onDateBlur={handleDateBlur}
              dateError={dateError}
            />
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

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete Record</Text>
        </TouchableOpacity>
      </ScrollView>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        type={toastType}
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
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
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
