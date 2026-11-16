import { Ionicons } from '@expo/vector-icons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { copyAudioToAppStorage } from '@/lib/audioFiles';

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function VocalRecorder({
  trackName,
  onClose,
  onSave,
}: {
  trackName: string;
  onClose: () => void;
  onSave: (uri: string, durationSeconds: number, size?: number) => void;
}) {
  const colors = useColors();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [permissionCanAskAgain, setPermissionCanAskAgain] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(
    () => () => {
      if (recorder.isRecording) {
        void recorder.stop().catch(() => undefined);
      }
      void setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      }).catch(() => undefined);
    },
    [recorder],
  );

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      setMessage(
        'Microphone recording is available in the mobile app, where audio files can be saved with the project.',
      );
      return;
    }

    setMessage(null);
    setIsPreparing(true);
    try {
      const permission = await requestRecordingPermissionsAsync();
      setPermissionCanAskAgain(permission.canAskAgain);
      if (!permission.granted) {
        setMessage(
          permission.canAskAgain
            ? 'Allow microphone access to record a vocal take.'
            : 'Microphone access is turned off for this app. Open Settings to enable it.',
        );
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Could not start recording: ${error.message}`
          : 'Could not start microphone recording.',
      );
    } finally {
      setIsPreparing(false);
    }
  };

  const stopRecording = async () => {
    setMessage(null);
    setIsPreparing(true);
    const duration = recorderState.durationMillis / 1000;
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        throw new Error('The recorder did not return an audio file.');
      }
      setRecordedUri(uri);
      setRecordedDuration(duration);
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Could not finish recording: ${error.message}`
          : 'Could not finish microphone recording.',
      );
    } finally {
      setIsPreparing(false);
    }
  };

  const saveTake = async () => {
    if (!recordedUri) {
      setMessage('No completed recording is available to save.');
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const stored = await copyAudioToAppStorage(
        recordedUri,
        `${trackName}-take`,
      );
      if (!stored.persistent) {
        throw new Error('Persistent audio storage is unavailable on this platform.');
      }
      onSave(stored.uri, recordedDuration, stored.size);
      onClose();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Could not save this take: ${error.message}`
          : 'Could not save this take to the project.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const requestClose = () => {
    if (recorderState.isRecording) {
      Alert.alert(
        'Recording is active',
        'Stop the recording before closing this panel.',
      );
      return;
    }
    onClose();
  };

  const isBusy = isPreparing || isSaving;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={requestClose}
    >
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.scrim, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.panel,
            { backgroundColor: colors.panel, borderColor: colors.line },
          ]}
        >
          <View style={styles.headingRow}>
            <View style={[styles.headingIcon, { backgroundColor: colors.violetLow }]}>
              <Ionicons name="mic" size={18} color={colors.primary} />
            </View>
            <View style={styles.headingCopy}>
              <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
                VOCAL RECORDING
              </Text>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {trackName}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close recorder"
              accessibilityState={{
                disabled: recorderState.isRecording || isBusy,
              }}
              disabled={recorderState.isRecording || isBusy}
              onPress={requestClose}
              style={styles.closeButton}
              testID="recorder-close"
            >
              <Ionicons
                name="close"
                size={20}
                color={
                  recorderState.isRecording || isBusy
                    ? colors.disabled
                    : colors.mutedForeground
                }
              />
            </Pressable>
          </View>

          {Platform.OS === 'web' ? (
            <View
              style={[
                styles.webNotice,
                { backgroundColor: colors.panelRaised, borderColor: colors.line },
              ]}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.webNoticeText, { color: colors.mutedForeground }]}>
                Record on an iOS or Android device so the audio file can be kept with
                your project.
              </Text>
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.meterPanel,
                  { backgroundColor: colors.background, borderColor: colors.line },
                ]}
              >
                <View
                  style={[
                    styles.recordingDot,
                    {
                      backgroundColor: recorderState.isRecording
                        ? colors.coral
                        : colors.disabled,
                    },
                  ]}
                />
                <Text style={[styles.timer, { color: colors.foreground }]}>
                  {formatTime(
                    recordedUri
                      ? recordedDuration
                      : recorderState.durationMillis / 1000,
                  )}
                </Text>
                <Text style={[styles.status, { color: colors.mutedForeground }]}>
                  {recorderState.isRecording
                    ? 'RECORDING'
                    : recordedUri
                      ? 'TAKE READY'
                      : 'READY'}
                </Text>
              </View>

              {!recordedUri ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    recorderState.isRecording ? 'Stop vocal recording' : 'Start vocal recording'
                  }
                  accessibilityState={{
                    disabled: isBusy,
                    selected: recorderState.isRecording,
                  }}
                  disabled={isBusy}
                  onPress={() =>
                    recorderState.isRecording
                      ? void stopRecording()
                      : void startRecording()
                  }
                  style={({ pressed }) => [
                    styles.recordButton,
                    {
                      backgroundColor: recorderState.isRecording
                        ? colors.panelRaised
                        : colors.primary,
                      borderColor: recorderState.isRecording
                        ? colors.coral
                        : colors.primary,
                    },
                    isBusy && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                  testID="record-vocal"
                >
                  <Ionicons
                    name={recorderState.isRecording ? 'stop' : 'radio-button-on'}
                    size={20}
                    color={
                      recorderState.isRecording
                        ? colors.coral
                        : colors.background
                    }
                  />
                  <Text
                    style={[
                      styles.recordButtonText,
                      {
                        color: recorderState.isRecording
                          ? colors.foreground
                          : colors.background,
                      },
                    ]}
                  >
                    {isPreparing
                      ? 'PREPARING'
                      : recorderState.isRecording
                        ? 'STOP'
                        : 'RECORD'}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.takeActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Discard vocal take"
                    onPress={requestClose}
                    style={[
                      styles.secondaryButton,
                      { borderColor: colors.line, backgroundColor: colors.panelRaised },
                    ]}
                    testID="discard-vocal-take"
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.mutedForeground}
                    />
                    <Text style={[styles.secondaryText, { color: colors.mutedForeground }]}>
                      DISCARD
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Save vocal take to project"
                    accessibilityState={{ disabled: isBusy }}
                    disabled={isBusy}
                    onPress={() => void saveTake()}
                    style={[
                      styles.saveButton,
                      { backgroundColor: colors.primary },
                      isBusy && styles.disabled,
                    ]}
                    testID="save-vocal-take"
                  >
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.background}
                    />
                    <Text style={[styles.saveText, { color: colors.background }]}>
                      {isSaving ? 'SAVING' : 'SAVE TAKE'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {!recorderState.isRecording && !recordedUri && (
                <Text style={[styles.permissionHint, { color: colors.mutedForeground }]}>
                  Microphone access is requested only when you start recording.
                </Text>
              )}

              {message && (
                <View
                  style={[
                    styles.errorBox,
                    { backgroundColor: colors.amberLow, borderColor: colors.amberLine },
                  ]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color={colors.amber}
                  />
                  <View style={styles.errorCopy}>
                    <Text style={[styles.errorText, { color: colors.foreground }]}>
                      {message}
                    </Text>
                    {!permissionCanAskAgain && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Open microphone settings"
                        onPress={() =>
                          void Linking.openSettings().catch(() =>
                            setMessage('Could not open device settings.'),
                          )
                        }
                        style={styles.settingsButton}
                        testID="open-microphone-settings"
                      >
                        <Text style={[styles.settingsText, { color: colors.primary }]}>
                          OPEN SETTINGS
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 16,
  },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingCopy: { flex: 1, gap: 3 },
  eyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  title: { fontSize: 15, fontWeight: '700' },
  closeButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  meterPanel: {
    minHeight: 126,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  recordingDot: { width: 8, height: 8, borderRadius: 4 },
  timer: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  status: { fontSize: 8, fontWeight: '800', letterSpacing: 1.3 },
  recordButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  recordButtonText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  takeActions: { flexDirection: 'row', gap: 8 },
  secondaryButton: {
    minHeight: 44,
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  secondaryText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
  saveButton: {
    minHeight: 44,
    flex: 1.25,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  saveText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
  permissionHint: { fontSize: 9, lineHeight: 14, textAlign: 'center' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  errorCopy: { flex: 1, gap: 6 },
  errorText: { fontSize: 9, lineHeight: 14 },
  settingsButton: { alignSelf: 'flex-start', paddingVertical: 4 },
  settingsText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  webNotice: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  webNoticeText: { flex: 1, fontSize: 10, lineHeight: 16 },
  disabled: { opacity: 0.56 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
