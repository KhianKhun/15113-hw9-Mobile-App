import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { ActivityRecord } from '../types';
import { formatDuration, formatDate } from '../utils/time';

interface Props {
  record: ActivityRecord;
  onPress: () => void;
}

export default function RecordCard({ record, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={1}>
          {record.name}
        </Text>
        <Text style={styles.cardDuration}>
          {formatDuration(record.totalDuration)}
        </Text>
      </View>
      <Text style={styles.cardDate}>{formatDate(record.createdAt)}</Text>
      <View style={styles.cardTags}>
        {record.tags.map((tag) => (
          <View key={tag} style={styles.cardTag}>
            <Text style={styles.cardTagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
