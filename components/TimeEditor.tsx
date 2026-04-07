import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
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
  // Date inputs
  firstStartDateInput: string;
  lastEndDateInput: string;
  onFirstStartDateChange: (text: string) => void;
  onLastEndDateChange: (text: string) => void;
  onDateBlur: () => void;
  dateError: string;
}

export default function TimeEditor({
  segments,
  firstStartInput,
  lastEndInput,
  onFirstStartChange,
  onLastEndChange,
  onBlur,
  timeError,
  firstStartDateInput,
  lastEndDateInput,
  onFirstStartDateChange,
  onLastEndDateChange,
  onDateBlur,
  dateError,
}: Props) {
  const [dateExpanded, setDateExpanded] = useState(false);

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

      {/* Time edit inputs */}
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

      {/* Date section — collapsible */}
      <TouchableOpacity
        style={styles.dateToggleRow}
        onPress={() => setDateExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.dateToggleLabel}>Edit dates</Text>
        <Text style={styles.dateToggleIcon}>{dateExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {dateExpanded && (
        <>
          <View style={styles.timeEditRow}>
            <View style={styles.timeEditField}>
              <Text style={styles.timeEditHint}>Start date</Text>
              <TextInput
                style={[styles.input, styles.dateInput, !!dateError && styles.inputError]}
                value={firstStartDateInput}
                onChangeText={onFirstStartDateChange}
                onBlur={onDateBlur}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
              />
            </View>
            <View style={styles.timeEditField}>
              <Text style={styles.timeEditHint}>End date</Text>
              <TextInput
                style={[styles.input, styles.dateInput, !!dateError && styles.inputError]}
                value={lastEndDateInput}
                onChangeText={onLastEndDateChange}
                onBlur={onDateBlur}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
              />
            </View>
          </View>
          {!!dateError && <Text style={styles.errorText}>{dateError}</Text>}
        </>
      )}
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
  dateInput: {
    textAlign: 'center',
    fontSize: 13,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  dateToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  dateToggleLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  dateToggleIcon: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});
