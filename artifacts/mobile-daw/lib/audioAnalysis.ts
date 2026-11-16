
import { getAudioBlob } from './audioFiles';

export interface AudioAnalysisResult {
  durationSeconds: number;
  detectedBpm?: number;
  waveform: number[];
}

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function createWaveform(
  audioBuffer: AudioBuffer,
  sampleCount: number,
): number[] {
  const channelCount = audioBuffer.numberOfChannels;
  const samplesPerBin = Math.max(
    1,
    Math.floor(audioBuffer.length / sampleCount),
  );

  const peaks: number[] = [];

  for (let bin = 0; bin < sampleCount; bin++) {
    const start = bin * samplesPerBin;
    const end = Math.min(
      audioBuffer.length,
      start + samplesPerBin,
    );

    let peak = 0;

    for (let channel = 0; channel < channelCount; channel++) {
      const data = audioBuffer.getChannelData(channel);

      for (let i = start; i < end; i++) {
        peak = Math.max(peak, Math.abs(data[i]));
      }
    }

    peaks.push(peak);
  }

  const maximum = Math.max(...peaks, 0.0001);

  return peaks.map((peak) =>
    Math.round((peak / maximum) * 1000) / 1000,
  );
}

function detectBpm(audioBuffer: AudioBuffer): number | undefined {
  const sampleRate = audioBuffer.sampleRate;
  const channelCount = audioBuffer.numberOfChannels;

  if (audioBuffer.duration < 8) {
    return undefined;
  }

  const frameSize = Math.max(
    1,
    Math.floor(sampleRate / 100),
  );

  const frameCount = Math.floor(
    audioBuffer.length / frameSize,
  );

  if (frameCount < 400) {
    return undefined;
  }

  const channels = Array.from(
    { length: channelCount },
    (_, index) => audioBuffer.getChannelData(index),
  );

  const energy: number[] = [];

  for (let frame = 0; frame < frameCount; frame++) {
    const start = frame * frameSize;
    let sum = 0;
    let count = 0;

    for (let channel = 0; channel < channelCount; channel++) {
      const data = channels[channel];

      for (
        let i = start;
        i < Math.min(start + frameSize, data.length);
        i += 2
      ) {
        sum += data[i] * data[i];
        count++;
      }
    }

    energy.push(Math.sqrt(sum / Math.max(count, 1)));
  }

  const onset = energy.map((value, index) => {
    if (index === 0) return 0;
    return Math.max(0, value - energy[index - 1]);
  });

  const maximum = Math.max(...onset);

  if (maximum < 0.0001) {
    return undefined;
  }

  const mean =
    onset.reduce((sum, value) => sum + value, 0) /
    onset.length;

  const centered = onset.map((value) =>
    Math.max(0, value - mean),
  );

  let bestLag = 0;
  let bestScore = 0;

  // Search for tempos between 60 and 180 BPM.
  const minimumLag = Math.floor(6000 / 180);
  const maximumLag = Math.ceil(6000 / 60);

  for (let lag = minimumLag; lag <= maximumLag; lag++) {
    let correlation = 0;
    let energyA = 0;
    let energyB = 0;

    for (let i = lag; i < centered.length; i++) {
      const a = centered[i];
      const b = centered[i - lag];

      correlation += a * b;
      energyA += a * a;
      energyB += b * b;
    }

    const score =
      correlation /
      Math.sqrt(energyA * energyB + 0.000000001);

    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  if (bestLag === 0 || bestScore < 0.08) {
    return undefined;
  }

  const bpm = Math.round(6000 / bestLag);

  if (bpm < 60 || bpm > 180) {
    return undefined;
  }

  return bpm;
}

export async function analyzeAudio(
  uri: string,
  waveformSamples = 96,
): Promise<AudioAnalysisResult> {
  if (typeof window === 'undefined') {
    throw new Error(
      'Audio analysis is currently supported in the web studio.',
    );
  }

  const AudioContextConstructor =
    window.AudioContext ||
    (window as WindowWithWebkitAudio).webkitAudioContext;

  if (!AudioContextConstructor) {
    throw new Error(
      'This browser does not support audio analysis.',
    );
  }

  const blob = await getAudioBlob(uri);
  const arrayBuffer = await blob.arrayBuffer();

  const context = new AudioContextConstructor();

  try {
    const audioBuffer = await context.decodeAudioData(
      arrayBuffer.slice(0),
    );

    const durationSeconds = audioBuffer.duration;

    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new Error('Could not determine the audio duration.');
    }

    return {
      durationSeconds,
      detectedBpm: detectBpm(audioBuffer),
      waveform: createWaveform(
        audioBuffer,
        Math.max(16, Math.min(256, waveformSamples)),
      ),
    };
  } finally {
    await context.close().catch(() => undefined);
  }
}
