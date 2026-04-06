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
import { COLORS } from '../constants';

interface Props {
  visible: boolean;
  onSave: (notes: string | null) => void;
  onSkip: () => void;
}

export default function PostSessionModal({ visible, onSave, onSkip }: Props) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) setNotes('');
  }, [visible]);

  function handleSave() {
    onSave(notes.trim() || null);
  }

  function handleSkip() {
    setNotes('');
    onSkip();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleSkip}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>How did it go?</Text>
          <Text style={styles.subtitle}>Add an optional note about this session.</Text>

          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Finished the hard part, still need to review section 3..."
            placeholderTextColor={COLORS.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            autoFocus
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save & Close</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>Skip</Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
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
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.text,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipBtnText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
});
