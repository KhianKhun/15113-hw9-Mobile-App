import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FIXED_TAGS, DEFAULT_TAG, COLORS } from '../constants';

interface Props {
  selectedTags: string[];
  onToggle: (tag: string) => void;
  customTags: string[];
  onDeleteCustomTag: (tag: string) => void;
  customTagInput: string;
  onCustomTagInputChange: (text: string) => void;
  onAddCustomTag: () => void;
}

export default function TagSelector({
  selectedTags,
  onToggle,
  customTags,
  onDeleteCustomTag,
  customTagInput,
  onCustomTagInputChange,
  onAddCustomTag,
}: Props) {
  const isActive = (tag: string) => selectedTags.includes(tag);

  return (
    <>
      <View style={styles.tagContainer}>
        {/* Default tag — non-deletable */}
        <TouchableOpacity
          style={[styles.tagChip, isActive(DEFAULT_TAG) && styles.tagChipActive]}
          onPress={() => onToggle(DEFAULT_TAG)}
        >
          <Text style={[styles.tagText, isActive(DEFAULT_TAG) && styles.tagTextActive]}>
            {DEFAULT_TAG}
          </Text>
        </TouchableOpacity>

        {/* Fixed tags — non-deletable */}
        {FIXED_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tagChip, isActive(tag) && styles.tagChipActive]}
            onPress={() => onToggle(tag)}
          >
            <Text style={[styles.tagText, isActive(tag) && styles.tagTextActive]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Custom tags — deletable */}
        {customTags.map((tag) => (
          <View
            key={tag}
            style={[styles.tagChip, isActive(tag) && styles.tagChipActive, styles.tagChipCustom]}
          >
            <TouchableOpacity onPress={() => onToggle(tag)}>
              <Text style={[styles.tagText, isActive(tag) && styles.tagTextActive]}>
                {tag}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDeleteCustomTag(tag)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.deleteTagText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Custom tag input row */}
      <View style={styles.customTagRow}>
        <TextInput
          style={[styles.input, styles.customTagInput]}
          placeholder="Add custom tag..."
          placeholderTextColor={COLORS.textSecondary}
          value={customTagInput}
          onChangeText={onCustomTagInputChange}
          onSubmitEditing={onAddCustomTag}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addTagBtn} onPress={onAddCustomTag}>
          <Text style={styles.addTagBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
  },
  customTagInput: {
    flex: 1,
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
});
