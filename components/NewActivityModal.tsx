import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { DEFAULT_TAG, COLORS } from '../constants';
import { loadCustomTags, saveCustomTags, deleteCustomTag } from '../storage/storage';
import TagSelector from './TagSelector';
import Toast from './Toast';

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
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCustomTags().then(setCustomTags);
      setName('');
      setSelectedTags([]);
      setCustomTagInput('');
      setNameError('');
      setToastVisible(false);
    }
  }, [visible]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function handleAddCustomTag() {
    const trimmed = customTagInput.trim();
    if (!trimmed || customTags.includes(trimmed)) {
      setCustomTagInput('');
      return;
    }
    const updated = [...customTags, trimmed];
    setCustomTags(updated);
    saveCustomTags(updated);
    setSelectedTags((prev) => [...prev, trimmed]);
    setCustomTagInput('');
  }

  async function handleDeleteCustomTag(tag: string) {
    await deleteCustomTag(tag);
    setCustomTags((prev) => prev.filter((t) => t !== tag));
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleStart() {
    if (!name.trim()) {
      setNameError('Please enter an activity name');
      return;
    }
    setNameError('');

    let finalTags = selectedTags;
    if (finalTags.length === 0) {
      finalTags = [DEFAULT_TAG];
      setSelectedTags([DEFAULT_TAG]);
      setToastVisible(true);
      setTimeout(() => onStart(name.trim(), finalTags), 1800);
      return;
    }

    onStart(name.trim(), finalTags);
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
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>New Activity</Text>

          <Text style={styles.label}>Activity Name *</Text>
          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            placeholder="e.g. Coding, Gym, Homework..."
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={(t) => { setName(t); setNameError(''); }}
            autoFocus
            returnKeyType="done"
          />
          {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}

          <Text style={styles.label}>Tags (optional — Default assigned if empty)</Text>
          <TagSelector
            selectedTags={selectedTags}
            onToggle={toggleTag}
            customTags={customTags}
            onDeleteCustomTag={handleDeleteCustomTag}
            customTagInput={customTagInput}
            onCustomTagInputChange={setCustomTagInput}
            onAddCustomTag={handleAddCustomTag}
          />

          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>Start</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Toast
        message="No tag selected — Default tag assigned"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        duration={1500}
      />
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
  startBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
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
