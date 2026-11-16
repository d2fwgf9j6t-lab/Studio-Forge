import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useColors } from '@/hooks/useColors';
import { useProject, getCategoryForImport } from '@/contexts/ProjectContext';
import { copyAudioToAppStorage } from '@/lib/audioFiles';
import {
  SOUND_CATEGORIES,
  type ImportedSound,
  type SoundCategory,
} from '@/types/project';

const CATEGORY_ICONS: Record<SoundCategory, keyof typeof Ionicons.glyphMap> = {
  Drums: 'disc-outline',
  '808s': 'pulse-outline',
  Samples: 'albums-outline',
  Melodies: 'musical-notes-outline',
  Vocals: 'mic-outline',
  Loops: 'repeat-outline',
  Instruments: 'musical-note-outline',
  Effects: 'flash-outline',
  Plugins: 'cube-outline',
  Favorites: 'heart-outline',
};

function formatSize(bytes?: number) {
  if (typeof bytes !== 'number' || bytes <= 0) return 'AUDIO FILE';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SoundBrowser() {
  const colors = useColors();
  const {
    project,
    addSounds,
    toggleFavorite,
    createFolder,
  } = useProject();
  const [search, setSearch] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<SoundCategory | null>(
    'Samples',
  );
  const [activeCategory, setActiveCategory] = useState<SoundCategory>('Samples');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [importing, setImporting] = useState(false);

  const query = search.trim().toLowerCase();
  const visibleSounds = useMemo(
    () =>
      project.sounds.filter((sound) => {
        const matchesQuery = sound.name.toLowerCase().includes(query);
        if (!matchesQuery) return false;
        if (activeFolderId) return sound.folderId === activeFolderId;
        if (activeCategory === 'Favorites') return sound.favorite;
        return sound.category === activeCategory && !sound.folderId;
      }),
    [project.sounds, query, activeCategory, activeFolderId],
  );

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const category = getCategoryForImport(activeCategory);
      let hasTemporaryBrowserFiles = false;
      const sounds: ImportedSound[] = [];
      for (const [index, asset] of result.assets.entries()) {
        const id = `sound-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`;
        const stored = await copyAudioToAppStorage(asset.uri, id);
        hasTemporaryBrowserFiles ||= !stored.persistent;
        sounds.push({
          id,
          name: asset.name,
          uri: stored.uri,
          mimeType: asset.mimeType ?? undefined,
          size: asset.size ?? stored.size,
          category,
          favorite: false,
          folderId: activeFolderId ?? undefined,
        });
      }
      addSounds(sounds);
      if (hasTemporaryBrowserFiles && Platform.OS === 'web') {
        Alert.alert(
          'Browser audio is temporary',
          'The file is available for this browser session. Re-import it after a reload if it is no longer available.',
        );
      }
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert(
        'Import failed',
        error instanceof Error
          ? error.message
          : 'The selected audio files could not be imported.',
      );
    } finally {
      setImporting(false);
    }
  };

  const handleCreateFolder = () => {
    const name = folderName.trim();
    if (!name) {
      Alert.alert('Folder name required', 'Enter a name for the new folder.');
      return;
    }
    createFolder(name);
    setFolderName('');
    setFolderOpen(false);
  };

  const openCategory = (category: SoundCategory) => {
    setActiveFolderId(null);
    setActiveCategory(category);
    setExpandedCategory((current) => (current === category ? null : category));
  };

  return (
    <>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.searchRow}>
            <View
              style={[
                styles.searchBox,
                { backgroundColor: colors.panel, borderColor: colors.line },
              ]}
            >
              <Ionicons name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search imported sounds"
                placeholderTextColor={colors.mutedForeground}
                returnKeyType="search"
                style={[styles.searchInput, { color: colors.foreground }]}
                accessibilityLabel="Search sounds"
                testID="sound-search"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={importing ? 'Importing audio' : 'Import audio files'}
              onPress={handleImport}
              disabled={importing}
              style={({ pressed }) => [
                styles.importButton,
                { backgroundColor: colors.lime },
                importing && styles.disabled,
                pressed && styles.pressed,
              ]}
              testID="import-audio"
            >
              <Ionicons name="arrow-down" size={16} color={colors.background} />
            </Pressable>
          </View>

          <View style={styles.libraryHeading}>
            <View>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                Sound library
              </Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                {project.sounds.length} imported audio files
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create library folder"
              onPress={() => setFolderOpen(true)}
              style={({ pressed }) => [
                styles.folderButton,
                { borderColor: colors.line, backgroundColor: colors.panel },
                pressed && styles.pressed,
              ]}
              testID="create-folder"
            >
              <Ionicons name="folder-outline" size={14} color={colors.cyan} />
              <Text style={[styles.folderButtonText, { color: colors.cyan }]}>
                NEW FOLDER
              </Text>
            </Pressable>
          </View>

          <View style={styles.categoryList}>
            {SOUND_CATEGORIES.map((category) => {
              const expanded = expandedCategory === category && !activeFolderId;
              const count =
                category === 'Favorites'
                  ? project.sounds.filter((sound) => sound.favorite).length
                  : project.sounds.filter(
                      (sound) => sound.category === category && !sound.folderId,
                    ).length;
              return (
                <View
                  key={category}
                  style={[
                    styles.categoryBlock,
                    { borderColor: expanded ? colors.limeLine : colors.line },
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${category}, ${count} files`}
                    accessibilityState={{ expanded }}
                    onPress={() => openCategory(category)}
                    style={[
                      styles.categoryHeader,
                      { backgroundColor: expanded ? colors.panelSelected : colors.panel },
                    ]}
                    testID={`category-${category.toLowerCase().replaceAll(' ', '-')}`}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        {
                          backgroundColor: expanded ? colors.limeLow : colors.panelRaised,
                        },
                      ]}
                    >
                      <Ionicons
                        name={CATEGORY_ICONS[category]}
                        size={15}
                        color={expanded ? colors.lime : colors.mutedForeground}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        { color: expanded ? colors.foreground : colors.mutedForeground },
                      ]}
                    >
                      {category}
                    </Text>
                    <Text style={[styles.categoryCount, { color: colors.mutedForeground }]}>
                      {String(count).padStart(2, '0')}
                    </Text>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                  {expanded && (
                    <View style={[styles.categoryContent, { backgroundColor: colors.background }]}>
                      {visibleSounds.length > 0 ? (
                        visibleSounds.map((sound) => (
                          <View
                            key={sound.id}
                            style={[
                              styles.soundRow,
                              { borderBottomColor: colors.line },
                            ]}
                          >
                            <View style={[styles.soundGlyph, { backgroundColor: colors.panelRaised }]}>
                              <Ionicons
                                name="musical-note"
                                size={14}
                                color={colors.cyan}
                              />
                            </View>
                            <View style={styles.soundCopy}>
                              <Text
                                numberOfLines={1}
                                style={[styles.soundName, { color: colors.foreground }]}
                              >
                                {sound.name}
                              </Text>
                              <Text style={[styles.soundMeta, { color: colors.mutedForeground }]}>
                                {formatSize(sound.size)} · PREVIEW UNAVAILABLE
                              </Text>
                            </View>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={
                                sound.favorite
                                  ? `Remove ${sound.name} from favorites`
                                  : `Add ${sound.name} to favorites`
                              }
                              onPress={() => toggleFavorite(sound.id)}
                              style={styles.favoriteButton}
                              testID={`favorite-${sound.id}`}
                            >
                              <Ionicons
                                name={sound.favorite ? 'heart' : 'heart-outline'}
                                size={17}
                                color={sound.favorite ? colors.coral : colors.mutedForeground}
                              />
                            </Pressable>
                          </View>
                        ))
                      ) : (
                        <View style={styles.emptyCategory}>
                          <Ionicons
                            name="musical-notes-outline"
                            size={19}
                            color={colors.mutedForeground}
                          />
                          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                            {query ? 'No matching sounds' : 'Nothing imported yet'}
                          </Text>
                          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                            {query
                              ? 'Try a different search or category.'
                              : 'Import an audio file to add it to this category.'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.foldersHeading}>
            <Ionicons name="folder-open-outline" size={14} color={colors.cyan} />
            <Text style={[styles.foldersTitle, { color: colors.foreground }]}>
              YOUR FOLDERS
            </Text>
            <Text style={[styles.categoryCount, { color: colors.mutedForeground }]}>
              {project.folders.length}
            </Text>
          </View>
          {project.folders.length === 0 ? (
            <Text style={[styles.noFolders, { color: colors.mutedForeground }]}>
              Create folders to organize imported files.
            </Text>
          ) : (
            project.folders.map((folder) => {
              const active = activeFolderId === folder.id;
              const folderSounds = project.sounds.filter(
                (sound) => sound.folderId === folder.id,
              );
              return (
                <Pressable
                  key={folder.id}
                  onPress={() => {
                    setActiveFolderId(active ? null : folder.id);
                    setExpandedCategory(null);
                  }}
                  style={[
                    styles.folderRow,
                    {
                      backgroundColor: active ? colors.panelSelected : colors.panel,
                      borderColor: active ? colors.limeLine : colors.line,
                    },
                  ]}
                  testID={`folder-${folder.id}`}
                >
                  <Ionicons name="folder" size={16} color={colors.cyan} />
                  <Text style={[styles.folderName, { color: colors.foreground }]}>
                    {folder.name}
                  </Text>
                  <Text style={[styles.categoryCount, { color: colors.mutedForeground }]}>
                    {folderSounds.length}
                  </Text>
                  <Ionicons
                    name={active ? 'chevron-up' : 'chevron-forward'}
                    size={14}
                    color={colors.mutedForeground}
                  />
                  {active && (
                    <View style={styles.folderContent}>
                      {folderSounds.length === 0 ? (
                        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                          Import files while this folder is selected.
                        </Text>
                      ) : (
                        folderSounds.map((sound) => (
                          <Text
                            key={sound.id}
                            numberOfLines={1}
                            style={[styles.folderSoundName, { color: colors.foreground }]}
                          >
                            {sound.name}
                          </Text>
                        ))
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={folderOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFolderOpen(false)}
      >
        <KeyboardAvoidingView behavior="padding" style={styles.modalScrim}>
          <View
            style={[
              styles.folderModal,
              { backgroundColor: colors.panelRaised, borderColor: colors.line },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              New library folder
            </Text>
            <TextInput
              value={folderName}
              onChangeText={setFolderName}
              autoFocus
              maxLength={32}
              returnKeyType="done"
              onSubmitEditing={handleCreateFolder}
              placeholder="Folder name"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.folderInput,
                {
                  backgroundColor: colors.panel,
                  borderColor: colors.line,
                  color: colors.foreground,
                },
              ]}
              testID="folder-name-input"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setFolderOpen(false)} style={styles.cancelButton}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                  CANCEL
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCreateFolder}
                style={[styles.createButton, { backgroundColor: colors.lime }]}
                testID="confirm-folder"
              >
                <Text style={[styles.createText, { color: colors.background }]}>
                  CREATE FOLDER
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
  flex: { flex: 1 },
  content: { padding: 14, paddingBottom: 26, gap: 12 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchBox: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 7, fontSize: 12 },
  importButton: {
    width: 44,
    minHeight: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  heading: { fontSize: 15, fontWeight: '700' },
  subheading: { fontSize: 9, marginTop: 3 },
  folderButton: {
    minHeight: 31,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  folderButtonText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.65 },
  categoryList: { gap: 6 },
  categoryBlock: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  categoryHeader: {
    minHeight: 44,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: { flex: 1, fontSize: 11, fontWeight: '700' },
  categoryCount: { fontSize: 8, fontWeight: '800', minWidth: 18, textAlign: 'right' },
  categoryContent: { paddingHorizontal: 9 },
  soundRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  soundGlyph: {
    width: 29,
    height: 29,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundCopy: { flex: 1, minWidth: 0, gap: 4 },
  soundName: { fontSize: 10, fontWeight: '700' },
  soundMeta: { fontSize: 7, fontWeight: '700', letterSpacing: 0.4 },
  favoriteButton: { width: 30, height: 36, alignItems: 'center', justifyContent: 'center' },
  emptyCategory: { minHeight: 112, alignItems: 'center', justifyContent: 'center', gap: 5 },
  emptyTitle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  emptyText: { fontSize: 9, textAlign: 'center', lineHeight: 14 },
  foldersHeading: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  foldersTitle: { flex: 1, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  noFolders: { fontSize: 9, lineHeight: 15, paddingHorizontal: 2 },
  folderRow: {
    minHeight: 42,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  folderName: { flex: 1, fontSize: 10, fontWeight: '700' },
  folderContent: { width: '100%', paddingBottom: 8, paddingLeft: 24, gap: 6 },
  folderSoundName: { fontSize: 9 },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 22,
  },
  folderModal: { padding: 18, borderWidth: 1, borderRadius: 18 },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 13 },
  folderInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  modalActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 5 },
  cancelText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
  createButton: { paddingHorizontal: 12, paddingVertical: 11, borderRadius: 9 },
  createText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
