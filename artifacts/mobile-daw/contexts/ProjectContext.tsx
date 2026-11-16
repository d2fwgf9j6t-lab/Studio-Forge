import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import {
  createInitialProject,
  TRACK_COLORS,
  type AssetCategory,
  type AudioClip,
  type DawProject,
  type ImportedSound,
  type MidiNote,
} from '@/types/project';

const PROJECT_STORAGE_KEY = '@northline-studio/project-v1';
const HISTORY_LIMIT = 40;

interface ProjectState {
  project: DawProject;
  past: DawProject[];
  future: DawProject[];
  revision: number;
  savedRevision: number;
  hydrated: boolean;
  storageError: string | null;
}

type Action =
  | { type: 'hydrate'; project: DawProject }
  | { type: 'load-error'; message: string }
  | { type: 'edit'; update: (project: DawProject) => DawProject }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'saved'; revision: number }
  | { type: 'save-error'; message: string };

const initialState: ProjectState = {
  project: createInitialProject(),
  past: [],
  future: [],
  revision: 0,
  savedRevision: 0,
  hydrated: false,
  storageError: null,
};

function reducer(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        project: action.project,
        past: [],
        future: [],
        revision: 0,
        savedRevision: 0,
        hydrated: true,
        storageError: null,
      };
    case 'load-error':
      return { ...state, hydrated: true, storageError: action.message };
    case 'edit': {
      const project = action.update(state.project);
      if (project === state.project) return state;
      return {
        ...state,
        project,
        past: [...state.past, state.project].slice(-HISTORY_LIMIT),
        future: [],
        revision: state.revision + 1,
        storageError: null,
      };
    }
    case 'undo': {
      if (state.past.length === 0) return state;
      const project = state.past[state.past.length - 1];
      return {
        ...state,
        project,
        past: state.past.slice(0, -1),
        future: [state.project, ...state.future].slice(0, HISTORY_LIMIT),
        revision: state.revision + 1,
        storageError: null,
      };
    }
    case 'redo': {
      if (state.future.length === 0) return state;
      const project = state.future[0];
      return {
        ...state,
        project,
        past: [...state.past, state.project].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        revision: state.revision + 1,
        storageError: null,
      };
    }
    case 'saved':
      return {
        ...state,
        savedRevision:
          state.revision === action.revision
            ? action.revision
            : state.savedRevision,
        storageError: null,
      };
    case 'save-error':
      return { ...state, storageError: action.message };
  }
}

interface ProjectContextValue {
  project: DawProject;
  activeTrackId: string;
  setActiveTrackId: (id: string) => void;
  isSaved: boolean;
  isHydrated: boolean;
  storageError: string | null;
  canUndo: boolean;
  canRedo: boolean;
  editProject: (update: (project: DawProject) => DawProject) => void;
  addTrack: (kind?: 'AUDIO' | 'VOCALS') => string;
  moveTrack: (trackId: string, direction: -1 | 1) => void;
  addSounds: (sounds: ImportedSound[]) => void;
  addAudioClip: (clip: Omit<AudioClip, 'id'>) => string;
  toggleFavorite: (soundId: string) => void;
  createFolder: (name: string) => void;
  toggleMidiNote: (trackId: string, pitch: number, step: number) => void;
  undo: () => void;
  redo: () => void;
  saveProject: () => Promise<boolean>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const legacyTrackNames = new Set(['Drums', '808 / Bass', 'Melody', 'Keys', 'Vocal', 'FX']);

function normalizeSavedTrackNames(project: DawProject): DawProject {
  let changed = false;
  const tracks = project.tracks.map((track, index) => {
    if (!legacyTrackNames.has(track.name) && !/^Track \d+$/i.test(track.name)) {
      return track;
    }

    const name = `Track ${index + 1}`;
    const color = TRACK_COLORS[index % TRACK_COLORS.length];
    if (track.name === name && track.color === color) return track;

    changed = true;
    return { ...track, name, color };
  });

  const audioClips = Array.isArray(project.audioClips) ? project.audioClips : [];
  if (!Array.isArray(project.audioClips)) changed = true;

  return changed ? { ...project, tracks, audioClips } : project;
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [activeTrackId, setActiveTrackId] = useState(
    initialState.project.tracks[0]?.id ?? '',
  );

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(PROJECT_STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (!raw) {
          dispatch({ type: 'hydrate', project: createInitialProject() });
          return;
        }
        const saved = JSON.parse(raw) as DawProject;
        if (
          !saved ||
          typeof saved.name !== 'string' ||
          !Array.isArray(saved.tracks) ||
          !Array.isArray(saved.sounds) ||
          !Array.isArray(saved.folders) ||
          !Array.isArray(saved.midiNotes)
        ) {
          throw new Error('The saved session has an unexpected format.');
        }
        const normalizedProject = normalizeSavedTrackNames(saved);
        dispatch({ type: 'hydrate', project: normalizedProject });
        setActiveTrackId(saved.tracks[0]?.id ?? '');
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          dispatch({
            type: 'load-error',
            message:
              error instanceof Error
                ? error.message
                : 'Could not load the saved session.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated || state.revision === state.savedRevision) return;
    const revision = state.revision;
    const project = state.project;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project))
        .then(() => dispatch({ type: 'saved', revision }))
        .catch((error: unknown) =>
          dispatch({
            type: 'save-error',
            message:
              error instanceof Error
                ? error.message
                : 'Could not save the session locally.',
          }),
        );
    }, 500);
    return () => clearTimeout(timer);
  }, [state.hydrated, state.project, state.revision, state.savedRevision]);

  const editProject = useCallback(
    (update: (project: DawProject) => DawProject) =>
      dispatch({ type: 'edit', update }),
    [],
  );

  const addTrack = useCallback((kind: 'AUDIO' | 'VOCALS' = 'AUDIO') => {
    const id = makeId('track');
    const trackNumber = state.project.tracks.length + 1;
    const color =
      TRACK_COLORS[state.project.tracks.length % TRACK_COLORS.length];
    const track = {
      id,
      name: `Track ${trackNumber}`,
      color,
      kind,
    };
    dispatch({
      type: 'edit',
      update: (project) => ({ ...project, tracks: [...project.tracks, track] }),
    });
    setActiveTrackId(id);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return id;
  }, [state.project.tracks.length]);

  const moveTrack = useCallback(
    (trackId: string, direction: -1 | 1) => {
      editProject((project) => {
        const index = project.tracks.findIndex((track) => track.id === trackId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= project.tracks.length) {
          return project;
        }
        const tracks = [...project.tracks];
        [tracks[index], tracks[target]] = [tracks[target], tracks[index]];
        return { ...project, tracks };
      });
    },
    [editProject],
  );

  const addSounds = useCallback(
    (sounds: ImportedSound[]) =>
      editProject((project) => ({
        ...project,
        sounds: [...project.sounds, ...sounds],
      })),
    [editProject],
  );

  const addAudioClip = useCallback(
    (clip: Omit<AudioClip, 'id'>) => {
      if (!state.project.tracks.some((track) => track.id === clip.trackId)) {
        throw new Error('Choose an existing track before placing audio.');
      }
      const id = makeId('clip');
      editProject((project) => ({
        ...project,
        audioClips: [...project.audioClips, { ...clip, id }],
      }));
      void Haptics.selectionAsync();
      return id;
    },
    [state.project.tracks, editProject],
  );

  const toggleFavorite = useCallback(
    (soundId: string) =>
      editProject((project) => ({
        ...project,
        sounds: project.sounds.map((sound) =>
          sound.id === soundId
            ? { ...sound, favorite: !sound.favorite }
            : sound,
        ),
      })),
    [editProject],
  );

  const createFolder = useCallback(
    (name: string) => {
      const folder = { id: makeId('folder'), name };
      editProject((project) => ({
        ...project,
        folders: [...project.folders, folder],
      }));
    },
    [editProject],
  );

  const toggleMidiNote = useCallback(
    (trackId: string, pitch: number, step: number) => {
      const noteId = `${trackId}:${pitch}:${step}`;
      editProject((project) => {
        const exists = project.midiNotes.some((note) => note.id === noteId);
        const midiNotes: MidiNote[] = exists
          ? project.midiNotes.filter((note) => note.id !== noteId)
          : [...project.midiNotes, { id: noteId, trackId, pitch, step }];
        return { ...project, midiNotes };
      });
      void Haptics.selectionAsync();
    },
    [editProject],
  );

  const saveProject = useCallback(async () => {
    const revision = state.revision;
    try {
      await AsyncStorage.setItem(
        PROJECT_STORAGE_KEY,
        JSON.stringify(state.project),
      );
      dispatch({ type: 'saved', revision });
      return true;
    } catch (error) {
      dispatch({
        type: 'save-error',
        message:
          error instanceof Error
            ? error.message
            : 'Could not save the session locally.',
      });
      return false;
    }
  }, [state.project, state.revision]);

  const value = useMemo<ProjectContextValue>(
    () => ({
      project: state.project,
      activeTrackId,
      setActiveTrackId,
      isSaved: state.revision === state.savedRevision,
      isHydrated: state.hydrated,
      storageError: state.storageError,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      editProject,
      addTrack,
      moveTrack,
      addSounds,
      addAudioClip,
      toggleFavorite,
      createFolder,
      toggleMidiNote,
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      saveProject,
    }),
    [
      state,
      activeTrackId,
      editProject,
      addTrack,
      moveTrack,
      addSounds,
      addAudioClip,
      toggleFavorite,
      createFolder,
      toggleMidiNote,
      saveProject,
    ],
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider.');
  }
  return context;
}

export function getCategoryForImport(category: string): AssetCategory {
  if (category === 'Favorites' || category === 'Plugins') return 'Samples';
  return category as AssetCategory;
}
