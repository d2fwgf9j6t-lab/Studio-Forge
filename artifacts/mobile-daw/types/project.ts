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
  '#C6F36D',
  '#78DDE2',
  '#E6A96B',
  '#B99AF5',
  '#F27E73',
  '#72B8F4',
  '#E9D16F',
  '#D487C8',
];

export function createInitialProject(): DawProject {
  const names = ['Drums', '808 / Bass', 'Melody', 'Keys', 'Vocal', 'FX'];
  return {
    id: 'project-starter',
    name: 'Untitled session',
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    tracks: names.map((name, index) => ({
      id: `track-${index + 1}`,
      name,
      color: TRACK_COLORS[index % TRACK_COLORS.length],
      kind: index === 0 ? 'DRUMS' : index === 1 ? 'BASS' : 'AUDIO',
    })),
    sounds: [],
    folders: [],
    midiNotes: [],
  };
}
