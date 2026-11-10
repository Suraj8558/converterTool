// Stand-ins for the native modules, so the app's own code can be tested in Node.
// They are fakes: they check how the app uses the modules, not how Android behaves.

type Part = string | { uri: string };
const join = (parts: Part[]) =>
  parts
    .map((part, index) => {
      const text = typeof part === 'string' ? part : part.uri;
      return index === 0 ? text.replace(/\/+$/, '') : text.replace(/^\/+|\/+$/g, '');
    })
    .join('/');

export const fakeFs = {
  /** File contents by address, as the base64 text appended to them. */
  files: new Map<string, string>(),
  folders: new Set<string>(),
  /** Every copy made, in order. */
  copies: [] as { from: string; to: string }[],
  /** Pauses, in milliseconds, for the next writes in turn. Shows that writes stay in order. */
  writeDelays: [] as number[],
  failCreateFile: false,
  failDeleteFolder: false,
  /** Folders Android has withdrawn access to: copying into them fails. */
  deniedFolders: new Set<string>(),
  /** What the system folder picker does next: a folder address, or 'cancel'. */
  pick: 'cancel' as string,
  picks: 0,
  reset() {
    this.files.clear();
    this.folders.clear();
    this.copies = [];
    this.writeDelays = [];
    this.failCreateFile = false;
    this.failDeleteFolder = false;
    this.deniedFolders.clear();
    this.pick = 'cancel';
    this.picks = 0;
  },
};

export class FakeDirectory {
  uri: string;
  constructor(...parts: Part[]) {
    this.uri = join(parts);
  }
  static async pickDirectoryAsync() {
    fakeFs.picks += 1;
    if (fakeFs.pick === 'cancel') throw new Error('The user cancelled');
    return new FakeDirectory(fakeFs.pick);
  }
  get name() {
    return decodeURIComponent(this.uri.slice(this.uri.lastIndexOf('/') + 1));
  }
  get exists() {
    return fakeFs.folders.has(this.uri);
  }
  create() {
    fakeFs.folders.add(this.uri);
  }
  delete() {
    if (fakeFs.failDeleteFolder) throw new Error('cannot delete');
    for (const key of [...fakeFs.files.keys()]) if (key.startsWith(`${this.uri}/`)) fakeFs.files.delete(key);
    for (const key of [...fakeFs.folders]) if (key === this.uri || key.startsWith(`${this.uri}/`)) fakeFs.folders.delete(key);
  }
}

export class FakeFile {
  uri: string;
  constructor(...parts: Part[]) {
    this.uri = join(parts);
  }
  get name() {
    return this.uri.slice(this.uri.lastIndexOf('/') + 1);
  }
  get exists() {
    return fakeFs.files.has(this.uri);
  }
  create() {
    if (fakeFs.failCreateFile) throw new Error('disk full');
    fakeFs.files.set(this.uri, '');
  }
  textSync() {
    return fakeFs.files.get(this.uri) ?? '';
  }
  delete() {
    fakeFs.files.delete(this.uri);
  }
  /**
   * Copies like the real library: into a folder the file keeps its name, and onto an existing
   * file or into a folder that already has one of that name it fails, unless told to overwrite.
   */
  async copy(destination: FakeFile | FakeDirectory, options?: { overwrite?: boolean }) {
    if (destination instanceof FakeDirectory && fakeFs.deniedFolders.has(destination.uri)) {
      throw new Error('Permission denied');
    }
    const target = destination instanceof FakeFile ? destination : new FakeFile(destination, this.name);
    if (fakeFs.files.has(target.uri) && !options?.overwrite) {
      throw Object.assign(new Error('Destination already exists'), { code: 'ERR_DESTINATION_ALREADY_EXISTS' });
    }
    fakeFs.copies.push({ from: this.uri, to: target.uri });
    fakeFs.files.set(target.uri, fakeFs.files.get(this.uri) ?? '');
  }
  rename(newName: string) {
    const renamed = `${this.uri.slice(0, this.uri.lastIndexOf('/') + 1)}${newName}`;
    fakeFs.files.set(renamed, fakeFs.files.get(this.uri) ?? '');
    fakeFs.files.delete(this.uri);
    this.uri = renamed;
  }
  async write(content: string, options?: { encoding?: string; append?: boolean }) {
    const delay = fakeFs.writeDelays.shift() ?? 0;
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    // The app stores text with the default encoding, and file contents as base64.
    if (options?.encoding && options.encoding !== 'base64') throw new Error('The app must write base64');
    const previous = options?.append ? (fakeFs.files.get(this.uri) ?? '') : '';
    fakeFs.files.set(this.uri, previous + content);
  }
}

export const fileSystemModule = {
  Directory: FakeDirectory,
  File: FakeFile,
  Paths: { cache: new FakeDirectory('file:///cache'), document: new FakeDirectory('file:///document') },
};

export const sharingModule = {
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async (..._args: unknown[]) => undefined),
};
