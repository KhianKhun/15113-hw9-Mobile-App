import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { TimeSegment } from '../types';
import { formatSegmentTimeDisplay, formatDurationFull } from '../utils/time';

interface Props {
  segments: TimeSegment[];
  firstStartInput: string;
  lastEndInput: string;
  onFirstStartChange: (text: string) => void;
  onLastEndChange: (text: string) => void;
  onBlur: () => void;
  timeError: string;
}

export default function TimeEditor({
  segments,
  firstStartInput,
  lastEndInput,
  onFirstStartChange,
  onLastEndChange,
  onBlur,
  timeError,
}: Props) {
  return (
    <>
      {/* Segment list */}
      <View style={styles.segmentsCard}>
        {segments.map((seg, i) => (
          <View key={i} style={styles.segmentRow}>
            <Text style={styles.segmentIndex}>{i + 1}</Text>
            <Text style={styles.segmentTime}>
              {formatSegmentTimeDisplay(seg.start)} – {formatSegmentTimeDisplay(seg.end)}
            </Text>
            <Text style={styles.segmentDuration}>
              {formatDurationFull(
                new Date(seg.end).getTime() - new Date(seg.start).getTime(),
              )}
            </Text>
          </View>
        ))}
      </View>

      {/* Edit inputs */}
      <View style={styles.timeEditRow}>
        <View style={styles.timeEditField}>
          <Text style={styles.timeEditHint}>First start</Text>
          <TextInput
            style={[styles.input, styles.timeInput, !!timeError && styles.inputError]}
            value={firstStartInput}
            onChangeText={onFirstStartChange}
            onBlur={onBlur}
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
            onChangeText={onLastEndChange}
            onBlur={onBlur}
            placeholder="HH:MM"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
          />
        </View>
      </View>
      {!!timeError && <Text style={styles.errorText}>{timeError}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
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
  timeInput: {
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
});
