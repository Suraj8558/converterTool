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
  /** Pauses, in milliseconds, for the next writes in turn. Shows that writes stay in order. */
  writeDelays: [] as number[],
  failCreateFile: false,
  failDeleteFolder: false,
  reset() {
    this.files.clear();
    this.folders.clear();
    this.writeDelays = [];
    this.failCreateFile = false;
    this.failDeleteFolder = false;
  },
};

class FakeDirectory {
  uri: string;
  constructor(...parts: Part[]) {
    this.uri = join(parts);
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

class FakeFile {
  uri: string;
  constructor(...parts: Part[]) {
    this.uri = join(parts);
  }
  get name() {
    return this.uri.slice(this.uri.lastIndexOf('/') + 1);
  }
  create() {
    if (fakeFs.failCreateFile) throw new Error('disk full');
    fakeFs.files.set(this.uri, '');
  }
  async write(content: string, options?: { encoding?: string; append?: boolean }) {
    const delay = fakeFs.writeDelays.shift() ?? 0;
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (options?.encoding !== 'base64') throw new Error('The app must write base64');
    const previous = options.append ? (fakeFs.files.get(this.uri) ?? '') : '';
    fakeFs.files.set(this.uri, previous + content);
  }
}

export const fileSystemModule = {
  Directory: FakeDirectory,
  File: FakeFile,
  Paths: { cache: new FakeDirectory('file:///cache') },
};

export const sharingModule = {
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async (..._args: unknown[]) => undefined),
};
