import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useColors } from '@/hooks/useColors';
import { useProject } from '@/contexts/ProjectContext';

function OfflineControl({
  icon,
  label,
  compact = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  compact?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Unavailable until an audio engine is added."
      accessibilityState={{ disabled: true }}
      disabled
      style={({ pressed }) => [
        styles.transportButton,
        compact && styles.compactLandscapeTransportButton,
        { borderColor: colors.line, backgroundColor: colors.panel },
        pressed && styles.pressed,
      ]}
      testID={`transport-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <Ionicons name={icon} size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export function StudioHeader() {
  const colors = useColors();
  const { width, height } = useWindowDimensions();
  const compactLandscape = width > height && height < 600;
  const {
    project,
    editProject,
    undo,
    redo,
    canUndo,
    canRedo,
    isSaved,
    isHydrated,
    storageError,
    saveProject,
  } = useProject();
  const [renameOpen, setRenameOpen] = useState(false);
  const [draftName, setDraftName] = useState(project.name);
  const [saving, setSaving] = useState(false);

  const openRename = () => {
    setDraftName(project.name);
    setRenameOpen(true);
  };

  const commitRename = () => {
    const name = draftName.trim();
    if (!name) {
      Alert.alert('Project name required', 'Enter a name for this session.');
      return;
    }
    editProject((current) => ({ ...current, name }));
    setRenameOpen(false);
    void Haptics.selectionAsync();
  };

  const handleSave = async () => {
    setSaving(true);
    const saved = await saveProject();
    setSaving(false);
    if (!saved) {
      Alert.alert(
        'Could not save',
        storageError ?? 'The session could not be saved on this device.',
      );
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const status = !isHydrated
    ? 'LOADING SESSION'
    : storageError
      ? 'LOCAL STORAGE ISSUE'
      : saving
        ? 'SAVING SESSION'
        : isSaved
          ? 'SAVED LOCALLY'
          : 'UNSAVED CHANGES';

  return (
    <>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.panel, borderBottomColor: colors.line },
          compactLandscape && styles.compactLandscapeHeader,
        ]}
      >
        <View
          style={[
            styles.headerContent,
            compactLandscape && styles.compactLandscapeHeaderContent,
          ]}
        >
        <View
          style={[
            styles.projectRow,
            compactLandscape && styles.compactLandscapeProjectRow,
          ]}
        >
          <View style={[styles.brand, compactLandscape && styles.compactLandscapeBrand]}>
            <View
              style={[
                styles.brandMark,
                compactLandscape && styles.compactLandscapeBrandMark,
                { backgroundColor: colors.lime },
              ]}
            >
              <Ionicons name="pulse" size={17} color={colors.background} />
            </View>
            <View style={styles.projectText}>
              <Text
                style={[
                  styles.brandName,
                  compactLandscape && styles.compactLandscapeBrandName,
                  { color: colors.mutedForeground },
                ]}
              >
                NORTHLINE / STUDIO
              </Text>
              <Pressable
                onPress={openRename}
                accessibilityRole="button"
                accessibilityLabel={`Rename project ${project.name}`}
                testID="project-name"
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.projectName,
                    compactLandscape && styles.compactLandscapeProjectName,
                    { color: colors.foreground },
                  ]}
                >
                  {project.name}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Undo"
              accessibilityState={{ disabled: !canUndo }}
              disabled={!canUndo}
              onPress={undo}
              style={({ pressed }) => [
                styles.iconButton,
                compactLandscape && styles.compactLandscapeIconButton,
                { borderColor: colors.line },
                !canUndo && styles.disabledButton,
                pressed && styles.pressed,
              ]}
              testID="undo-button"
            >
              <Ionicons
                name="return-up-back"
                size={17}
                color={canUndo ? colors.foreground : colors.mutedForeground}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Redo"
              accessibilityState={{ disabled: !canRedo }}
              disabled={!canRedo}
              onPress={redo}
              style={({ pressed }) => [
                styles.iconButton,
                compactLandscape && styles.compactLandscapeIconButton,
                { borderColor: colors.line },
                !canRedo && styles.disabledButton,
                pressed && styles.pressed,
              ]}
              testID="redo-button"
            >
              <Ionicons
                name="return-up-forward"
                size={17}
                color={canRedo ? colors.foreground : colors.mutedForeground}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save project locally"
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveButton,
                compactLandscape && styles.compactLandscapeSaveButton,
                { backgroundColor: colors.lime },
                pressed && styles.pressed,
              ]}
              testID="save-project"
            >
              <Ionicons name="save-outline" size={15} color={colors.background} />
              <Text style={[styles.saveText, { color: colors.background }]}>
                SAVE
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.transportRow,
            compactLandscape && styles.compactLandscapeTransportRow,
          ]}
          keyboardShouldPersistTaps="handled"
          style={compactLandscape ? styles.compactLandscapeTransportScroll : undefined}
        >
          <OfflineControl icon="play" label="Play" compact={compactLandscape} />
          <OfflineControl icon="pause" label="Pause" compact={compactLandscape} />
          <OfflineControl icon="stop" label="Stop" compact={compactLandscape} />
          <OfflineControl icon="radio-button-on" label="Record" compact={compactLandscape} />
          <View style={[styles.toolbarDivider, { backgroundColor: colors.line }]} />
          <View
            style={[
              styles.bpmControl,
              compactLandscape && styles.compactLandscapeBpmControl,
              { borderColor: colors.line, backgroundColor: colors.panelRaised },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease tempo"
              onPress={() =>
                editProject((current) => ({
                  ...current,
                  bpm: Math.max(40, current.bpm - 1),
                }))
              }
              style={[
                styles.bpmStep,
                compactLandscape && styles.compactLandscapeBpmStep,
              ]}
              testID="bpm-decrease"
            >
              <Ionicons name="remove" size={14} color={colors.mutedForeground} />
            </Pressable>
            <View
              style={[
                styles.bpmValue,
                compactLandscape && styles.compactLandscapeBpmValue,
              ]}
            >
              <Text
                style={[
                  styles.bpmNumber,
                  compactLandscape && styles.compactLandscapeBpmNumber,
                  { color: colors.lime },
                ]}
              >
                {project.bpm}
              </Text>
              <Text
                style={[
                  styles.bpmLabel,
                  compactLandscape && styles.compactLandscapeBpmLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                BPM
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase tempo"
              onPress={() =>
                editProject((current) => ({
                  ...current,
                  bpm: Math.min(240, current.bpm + 1),
                }))
              }
              style={[
                styles.bpmStep,
                compactLandscape && styles.compactLandscapeBpmStep,
              ]}
              testID="bpm-increase"
            >
              <Ionicons name="add" size={14} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <View
            style={[
              styles.timeChip,
              compactLandscape && styles.compactLandscapeTimeChip,
              { borderColor: colors.line },
            ]}
          >
            <Text
              style={[
                styles.timeText,
                compactLandscape && styles.compactLandscapeTimeText,
                { color: colors.foreground },
              ]}
            >
              {project.timeSignature.numerator}/{project.timeSignature.denominator}
            </Text>
          </View>
          <OfflineControl icon="timer-outline" label="Metronome" compact={compactLandscape} />
          <OfflineControl icon="repeat" label="Loop" compact={compactLandscape} />
          <OfflineControl icon="download-outline" label="Export" compact={compactLandscape} />
        </ScrollView>

      <View
        style={[
          styles.engineStatus,
          compactLandscape && styles.compactLandscapeEngineStatus,
        ]}
      >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: storageError ? colors.destructive : colors.amber },
            ]}
          />
          <Text
            style={[
              styles.engineText,
              compactLandscape && styles.compactLandscapeEngineText,
              { color: colors.mutedForeground },
            ]}
          >
            {status}
          </Text>
          <View style={[styles.statusDivider, { backgroundColor: colors.line }]} />
          <Text
            style={[
              styles.engineText,
              compactLandscape && styles.compactLandscapeEngineText,
              { color: colors.amber },
            ]}
          >
            AUDIO ENGINE OFFLINE
          </Text>
        </View>
        </View>
      </View>

      <Modal
        visible={renameOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameOpen(false)}
      >
        <KeyboardAvoidingView behavior="padding" style={styles.modalScrim}>
          <View
            style={[
              styles.renameCard,
              { backgroundColor: colors.panelRaised, borderColor: colors.line },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Rename session
            </Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              autoFocus
              maxLength={48}
              returnKeyType="done"
              onSubmitEditing={commitRename}
              placeholder="Session name"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.renameInput,
                {
                  backgroundColor: colors.panel,
                  borderColor: colors.line,
                  color: colors.foreground,
                },
              ]}
              testID="project-name-input"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setRenameOpen(false)} style={styles.modalButton}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                  CANCEL
                </Text>
              </Pressable>
              <Pressable
                onPress={commitRename}
                style={[styles.confirmButton, { backgroundColor: colors.lime }]}
              >
                <Text style={[styles.confirmText, { color: colors.background }]}>
                  UPDATE NAME
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 5,
    paddingBottom: 7,
  },
  compactLandscapeHeader: {
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 2,
  },
  headerContent: {},
  compactLandscapeHeaderContent: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  compactLandscapeProjectRow: {
    minHeight: 30,
    gap: 6,
    flexBasis: 234,
    flexGrow: 0,
    flexShrink: 0,
  },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  compactLandscapeBrand: { gap: 6 },
  brandMark: {
    width: 31,
    height: 31,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactLandscapeBrandMark: { width: 24, height: 24, borderRadius: 7 },
  projectText: { flex: 1 },
  brandName: { fontSize: 8, fontWeight: '700', letterSpacing: 1.4 },
  compactLandscapeBrandName: { fontSize: 6, letterSpacing: 0.9 },
  projectName: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  compactLandscapeProjectName: { fontSize: 10, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  iconButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactLandscapeIconButton: { width: 26, height: 26, borderRadius: 7 },
  disabledButton: { opacity: 0.42 },
  saveButton: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  compactLandscapeSaveButton: { height: 26, paddingHorizontal: 7, borderRadius: 7 },
  saveText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  transportRow: { alignItems: 'center', gap: 7, paddingVertical: 7 },
  compactLandscapeTransportRow: { gap: 4, paddingVertical: 2 },
  compactLandscapeTransportScroll: { flex: 1, minWidth: 0 },
  transportButton: {
    width: 34,
    height: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 9,
    opacity: 0.48,
  },
  compactLandscapeTransportButton: { width: 29, height: 27, borderRadius: 7 },
  toolbarDivider: { width: 1, height: 26, marginHorizontal: 2 },
  bpmControl: {
    height: 35,
    borderWidth: 1,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactLandscapeBpmControl: { height: 28, borderRadius: 7 },
  bpmStep: { width: 25, height: 33, alignItems: 'center', justifyContent: 'center' },
  compactLandscapeBpmStep: { width: 21, height: 26 },
  bpmValue: { minWidth: 44, alignItems: 'center' },
  compactLandscapeBpmValue: { minWidth: 35 },
  bpmNumber: { fontSize: 12, fontWeight: '800', lineHeight: 14 },
  compactLandscapeBpmNumber: { fontSize: 10, lineHeight: 11 },
  bpmLabel: { fontSize: 7, fontWeight: '700', letterSpacing: 1 },
  compactLandscapeBpmLabel: { fontSize: 6, letterSpacing: 0.6 },
  timeChip: {
    height: 32,
    minWidth: 41,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    borderWidth: 1,
    borderRadius: 8,
  },
  compactLandscapeTimeChip: { height: 27, minWidth: 36, borderRadius: 7 },
  timeText: { fontSize: 11, fontWeight: '700' },
  compactLandscapeTimeText: { fontSize: 9 },
  engineStatus: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactLandscapeEngineStatus: {
    height: 30,
    flexBasis: 140,
    maxWidth: 140,
    flexShrink: 0,
    flexWrap: 'wrap',
    alignContent: 'center',
    gap: 3,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  engineText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.65 },
  compactLandscapeEngineText: { fontSize: 6, letterSpacing: 0.3 },
  statusDivider: { width: 1, height: 10, marginHorizontal: 2 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center',
    padding: 22,
  },
  renameCard: { padding: 18, borderWidth: 1, borderRadius: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  renameInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  modalButton: { paddingHorizontal: 8, paddingVertical: 10 },
  cancelText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  confirmButton: { borderRadius: 9, paddingHorizontal: 12, paddingVertical: 11 },
  confirmText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
});
