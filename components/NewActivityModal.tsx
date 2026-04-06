import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FIXED_TAGS, COLORS } from '../constants';
import { loadCustomTags, saveCustomTags } from '../storage/storage';

interface Props {
  visible: boolean;
  onClose: () => void;
  onStart: (name: string, tags: string[]) => void;
}

export default function NewActivityModal({ visible, onClose, onStart }: Props) {
  const [name, setName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (visible) {
      loadCustomTags().then(setCustomTags);
      setName('');
      setSelectedTags([]);
      setCustomTagInput('');
      setNameError('');
    }
  }, [visible]);

  const allTags = [...FIXED_TAGS, ...customTags];

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
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
    setSelectedTags((prev) => [...prev, trimmed]);
    setCustomTagInput('');
  }

  function handleStart() {
    if (!name.trim()) {
      setNameError('Please enter an activity name');
      return;
    }
    if (selectedTags.length === 0) {
      setNameError('Please select at least one tag');
      return;
    }
    setNameError('');
    onStart(name.trim(), selectedTags);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>New Activity</Text>

          <Text style={styles.label}>Activity Name *</Text>
          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            placeholder="e.g. Coding, Gym, Homework..."
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={(t) => {
              setName(t);
              setNameError('');
            }}
            autoFocus
            returnKeyType="done"
          />
          {!!nameError && (
            <Text style={styles.errorText}>{nameError}</Text>
          )}

          <Text style={styles.label}>Tags * (select at least one)</Text>
          <View style={styles.tagContainer}>
            {allTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  selectedTags.includes(tag) && styles.tagChipActive,
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.tagTextActive,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
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

          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>Start</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
  tagText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  tagTextActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  customTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
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
  startBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  startBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
});
