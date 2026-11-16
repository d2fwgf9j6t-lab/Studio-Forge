import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

export interface StoredAudioFile {
  uri: string;
  size?: number;
  persistent: boolean;
}

function safeFileStem(value: string) {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return cleaned || `audio-${Date.now()}`;
}

export async function copyAudioToAppStorage(
  sourceUri: string,
  fileStem: string,
): Promise<StoredAudioFile> {
  if (!sourceUri) {
    throw new Error('The selected audio file has no local URI.');
  }

  if (Platform.OS === 'web') {
    return { uri: sourceUri, persistent: false };
  }

  const source = new File(sourceUri);
  const extension = source.extension || '.m4a';
  const destinationDirectory = new Directory(Paths.document, 'northline-audio');
  const storedPrefix = `${destinationDirectory.uri.replace(/\/+$/, '')}/`;
  if (sourceUri.startsWith(storedPrefix)) {
    return {
      uri: sourceUri,
      size: source.size ?? undefined,
      persistent: true,
    };
  }
  if (!destinationDirectory.exists) {
    destinationDirectory.create({ idempotent: true, intermediates: true });
  }

  const destination = new File(
    destinationDirectory,
    `${safeFileStem(fileStem)}-${Date.now()}${extension}`,
  );
  await source.copy(destination);

  return {
    uri: destination.uri,
    size: destination.size ?? undefined,
    persistent: true,
  };
}
