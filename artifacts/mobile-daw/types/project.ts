export const SOUND_CATEGORIES = [
  'Drums',
  '808s',
  'Samples',
  'Melodies',
  'Vocals',
  'Loops',
  'Instruments',
  'Effects',
  'Plugins',
  'Favorites',
] as const;

export type SoundCategory = (typeof SOUND_CATEGORIES)[number];
export type AssetCategory = Exclude<SoundCategory, 'Favorites'>;

export interface Track {
  id: string;
  name: string;
  color: string;
  kind: string;
}

export interface ImportedSound {
  id: string;
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
  category: AssetCategory;
  favorite: boolean;
  folderId?: string;
}

export interface LibraryFolder {
  id: string;
  name: string;
}

export interface MidiNote {
  id: string;
  trackId: string;
  pitch: number;
  step: number;
}

export interface DawProject {
  id: string;
  name: string;
  bpm: number;
  timeSignature: {
    numerator: number;
    denominator: number;
  };
  tracks: Track[];
  sounds: ImportedSound[];
  folders: LibraryFolder[];
  midiNotes: MidiNote[];
}

export const TRACK_COLORS = [
  '#BE96FF',
  '#916BD2',
  '#D0B1FF',
  '#A77CE5',
  '#7652B3',
  '#C7A0F7',
  '#986ECD',
  '#DDC3FF',
];

export function createInitialProject(): DawProject {
  const trackCount = 6;
  return {
    id: 'project-starter',
    name: 'Untitled session',
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    tracks: Array.from({ length: trackCount }, (_, index) => ({
      id: `track-${index + 1}`,
      name: `Track ${index + 1}`,
      color: TRACK_COLORS[index % TRACK_COLORS.length],
      kind: index === 0 ? 'DRUMS' : index === 1 ? 'BASS' : 'AUDIO',
    })),
    sounds: [],
    folders: [],
    midiNotes: [],
  };
}
