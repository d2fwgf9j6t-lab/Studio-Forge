
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

export interface StoredAudioFile {
  uri: string;
  size?: number;
  persistent: boolean;
}

const DB_NAME = 'northline-studio-audio';
const STORE_NAME = 'audio-files';
const WEB_AUDIO_PREFIX = 'idb-audio:';

interface AudioRecord {
  id: string;
  blob: Blob;
  name: string;
  createdAt: number;
}

function safeFileStem(value: string) {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return cleaned || `audio-${Date.now()}`;
}

function openAudioDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Browser audio storage is unavailable.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Could not open audio storage.'));
  });
}

async function saveWebAudio(
  blob: Blob,
  fileStem: string,
): Promise<StoredAudioFile> {
  const database = await openAudioDatabase();

  const id = `${safeFileStem(fileStem)}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;

  const record: AudioRecord = {
    id,
    blob,
    name: fileStem,
    createdAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');

    transaction.objectStore(STORE_NAME).put(record);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Could not save audio.'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Audio save was cancelled.'));
  });

  database.close();

  return {
    uri: `${WEB_AUDIO_PREFIX}${id}`,
    size: blob.size,
    persistent: true,
  };
}

export async function copyAudioToAppStorage(
  sourceUri: string,
  fileStem: string,
  sourceBlob?: Blob,
): Promise<StoredAudioFile> {
  if (!sourceUri && !sourceBlob) {
    throw new Error('The selected audio file has no source.');
  }

  if (Platform.OS === 'web') {
    let blob = sourceBlob;

    if (!blob && sourceUri.startsWith(WEB_AUDIO_PREFIX)) {
      return {
        uri: sourceUri,
        persistent: true,
      };
    }

    if (!blob) {
      const response = await fetch(sourceUri);

      if (!response.ok) {
        throw new Error('Could not read the selected audio file.');
      }

      blob = await response.blob();
    }

    return saveWebAudio(blob, fileStem);
  }

  if (!sourceUri) {
    throw new Error('A local file URI is required on this device.');
  }

  const source = new File(sourceUri);
  const extension = source.extension || '.m4a';
  const destinationDirectory = new Directory(
    Paths.document,
    'northline-audio',
  );

  const storedPrefix = `${destinationDirectory.uri.replace(/\/+$/, '')}/`;

  if (sourceUri.startsWith(storedPrefix)) {
    return {
      uri: sourceUri,
      size: source.size ?? undefined,
      persistent: true,
    };
  }

  if (!destinationDirectory.exists) {
    destinationDirectory.create({
      idempotent: true,
      intermediates: true,
    });
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

export async function getAudioBlob(uri: string): Promise<Blob> {
  if (uri.startsWith(WEB_AUDIO_PREFIX)) {
    const id = uri.slice(WEB_AUDIO_PREFIX.length);
    const database = await openAudioDatabase();

    const record = await new Promise<AudioRecord | undefined>(
      (resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const request = transaction.objectStore(STORE_NAME).get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error ?? new Error('Could not load audio.'));
      },
    );

    database.close();

    if (!record?.blob) {
      throw new Error('This audio file could not be found in browser storage.');
    }

    return record.blob;
  }

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error('Could not load the audio file.');
  }

  return response.blob();
}

export async function createAudioObjectUrl(
  uri: string,
): Promise<string> {
  const blob = await getAudioBlob(uri);
  return URL.createObjectURL(blob);
}

export async function deleteStoredAudio(uri: string): Promise<void> {
  if (!uri.startsWith(WEB_AUDIO_PREFIX)) return;

  const id = uri.slice(WEB_AUDIO_PREFIX.length);
  const database = await openAudioDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');

    transaction.objectStore(STORE_NAME).delete(id);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Could not delete audio.'));
  });

  database.close();
}
