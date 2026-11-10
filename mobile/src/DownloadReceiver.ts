import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { safeFileName, type BridgeMessage } from './downloads';
import { androidFolderStore, type FolderStore } from './saveFolder';

interface Pending {
  file: File;
  folder: Directory;
  mime: string;
  /** Chunks must be written one after another, in the order they arrived. */
  writes: Promise<void>;
}

export interface FinishedDownload {
  name: string;
  /** The folder the file was saved in, or null when it went to the share sheet instead. */
  folder: string | null;
  /** Opens the share sheet for the saved file. */
  share: () => Promise<void>;
}

export interface DownloadEvents {
  onStart: (name: string) => void;
  onDone: (download: FinishedDownload) => void;
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
 * Collects a file sent by the web page piece by piece, then saves it in the folder the
 * user chose. If they decline to choose one, or the folder can't be used, the file goes
 * to Android's share sheet instead, so it is never lost.
 */
export class DownloadReceiver {
  private pending = new Map<string, Pending>();

  constructor(
    private events: DownloadEvents,
    private folders: FolderStore = androidFolderStore
  ) {}

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
      const name = item.file.name;
      const share = () => shareFile(item);
      const folder = await this.saveInFolder(item);
      if (folder === null) await share();
      this.events.onDone({ name, folder, share });
    } catch (error) {
      this.events.onFailed(error instanceof Error ? error.message : 'The file could not be saved.');
    }
  }

  /** Copies the file into the user's folder and returns the folder's name, or null if it could not. */
  private async saveInFolder(item: Pending): Promise<string | null> {
    let folder = this.folders.savedFolder();
    // A second try lets the user choose again if the old folder was deleted or Android took back access.
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!folder) folder = await this.folders.chooseFolder();
      if (!folder) return null;
      try {
        const target = folder.createFile(item.file.name, item.mime || 'application/octet-stream');
        await item.file.copy(target);
        return folder.name;
      } catch {
        this.folders.forget();
        folder = null;
      }
    }
    return null;
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

async function shareFile(item: Pending) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(item.file.uri, { mimeType: item.mime || undefined, dialogTitle: item.file.name });
}
