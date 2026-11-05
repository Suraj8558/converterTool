const SAMPLE_RATE = 44100;

export function encodeWav(
  audio: Pick<AudioBuffer, 'numberOfChannels' | 'length' | 'sampleRate' | 'getChannelData'>
): Blob {
  const channels = audio.numberOfChannels;
  const bytesPerSample = 2;
  const dataSize = audio.length * channels * bytesPerSample;
  const view = new DataView(new ArrayBuffer(44 + dataSize));

  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, audio.sampleRate, true);
  view.setUint32(28, audio.sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeText(36, 'data');
  view.setUint32(40, dataSize, true);

  const channelData = Array.from({ length: channels }, (_, c) => audio.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < audio.length; i++) {
    for (let c = 0; c < channels; c++) {
      const sample = Math.max(-1, Math.min(1, channelData[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return new Blob([view.buffer], { type: 'audio/wav' });
}

export async function mp3ToWav(file: File): Promise<Blob> {
  if (typeof OfflineAudioContext === 'undefined') {
    throw new Error("This browser can't process audio. Please try a current version of Chrome, Edge, Firefox or Safari.");
  }
  const context = new OfflineAudioContext(2, 1, SAMPLE_RATE);
  let audio: AudioBuffer;
  try {
    audio = await context.decodeAudioData(await file.arrayBuffer());
  } catch {
    throw new Error(`"${file.name}" could not be decoded as audio.`);
  }
  return encodeWav(audio);
}
