import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { safeFileName, type BridgeMessage } from './downloads';

interface Pending {
  file: File;
  folder: Directory;
  mime: string;
  /** Chunks must be written one after another, in the order they arrived. */
  writes: Promise<void>;
}

export interface DownloadEvents {
  onStart: (name: string) => void;
  onDone: () => void;
  onFailed: (reason: string) => void;
}

const downloadsFolder = () => new Directory(Paths.cache, 'downloads');

/** Removes files left behind by earlier downloads. Call once when the app starts. */
export function clearOldDownloads() {
  try {
    const folder = downloadsFolder();
    if (folder.exists) folder.delete();
  } catch {
    // The system clears the cache folder when it needs room, so this can wait.
  }
}

/**
 * Collects a file sent by the web page piece by piece, saves it in the app's cache and
 * opens Android's share sheet, from where the user can save it to Files, Drive or send
 * it to another app.
 */
export class DownloadReceiver {
  private pending = new Map<string, Pending>();

  constructor(private events: DownloadEvents) {}

  async handle(message: BridgeMessage): Promise<void> {
    switch (message.type) {
      case 'download-start':
        return this.start(message.id, message.name, message.mime);
      case 'download-chunk': {
        const item = this.pending.get(message.id);
        if (!item) return;
        const { data } = message;
        item.writes = item.writes.then(() => item.file.write(data, { encoding: 'base64', append: true }));
        return;
      }
      case 'download-end':
        return this.finish(message.id);
      case 'download-error':
        this.discard(message.id);
        this.events.onFailed(message.message || 'The file could not be prepared.');
    }
  }

  private start(id: string, name: string, mime: string) {
    try {
      // Each file gets its own folder, so the name shown in the share sheet stays clean.
      const folder = new Directory(downloadsFolder(), id);
      folder.create({ intermediates: true, idempotent: true });
      const file = new File(folder, safeFileName(name, mime));
      file.create({ overwrite: true });
      this.pending.set(id, { file, folder, mime, writes: Promise.resolve() });
      this.events.onStart(file.name);
    } catch (error) {
      this.events.onFailed(error instanceof Error ? error.message : 'The file could not be saved.');
    }
  }

  private async finish(id: string) {
    const item = this.pending.get(id);
    if (!item) return;
    this.pending.delete(id);
    try {
      await item.writes;
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
      await Sharing.shareAsync(item.file.uri, { mimeType: item.mime || undefined, dialogTitle: item.file.name });
      this.events.onDone();
    } catch (error) {
      this.events.onFailed(error instanceof Error ? error.message : 'The file could not be saved.');
    }
  }

  private discard(id: string) {
    const item = this.pending.get(id);
    this.pending.delete(id);
    try {
      item?.folder.delete();
    } catch {
      // Nothing to clean up.
    }
  }
}
