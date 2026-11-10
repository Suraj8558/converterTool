import { DownloadReceiver, clearOldDownloads, type DownloadEvents } from '../src/DownloadReceiver';
import type { FolderStore } from '../src/saveFolder';
import { FakeDirectory, fakeFs, sharingModule } from './support/fakeNative';

jest.mock('expo-file-system', () => require('./support/fakeNative').fileSystemModule);
jest.mock('expo-sharing', () => require('./support/fakeNative').sharingModule);

const CACHE = 'file:///cache/downloads';
const DOCS = 'content://tree/Documents';

/** A folder store that remembers `saved`, and lets the user choose `next` when asked. */
function folderStore(saved: string | null, next: string | null = null) {
  let current = saved;
  const store = {
    savedFolder: jest.fn(() => (current ? (new FakeDirectory(current) as never) : null)),
    chooseFolder: jest.fn(async () => {
      if (next === null) return null;
      current = next;
      return new FakeDirectory(next) as never;
    }),
    forget: jest.fn(() => {
      current = null;
    }),
  } satisfies FolderStore;
  return store;
}

function setup(store = folderStore(DOCS)) {
  const events = { onStart: jest.fn(), onDone: jest.fn(), onFailed: jest.fn() } satisfies DownloadEvents;
  return { events, store, receiver: new DownloadReceiver(events, store) };
}

async function sendFile(receiver: DownloadReceiver, id: string, name: string, mime: string, chunks = ['QUJD', 'REVG']) {
  await receiver.handle({ type: 'download-start', id, name, mime });
  for (const data of chunks) await receiver.handle({ type: 'download-chunk', id, data });
  await receiver.handle({ type: 'download-end', id });
}

beforeEach(() => {
  fakeFs.reset();
  sharingModule.isAvailableAsync.mockClear().mockResolvedValue(true);
  sharingModule.shareAsync.mockClear().mockResolvedValue(undefined);
});

describe('saving in the user’s folder', () => {
  it('puts the chunks together and saves the file in the chosen folder, without the share sheet', async () => {
    const { receiver, events } = setup();
    await receiver.handle({ type: 'download-start', id: 'abc', name: 'my file.pdf', mime: 'application/pdf' });
    expect(events.onStart).toHaveBeenCalledWith('my file.pdf');
    await receiver.handle({ type: 'download-chunk', id: 'abc', data: 'QUJD' });
    await receiver.handle({ type: 'download-chunk', id: 'abc', data: 'REVG' });
    await receiver.handle({ type: 'download-end', id: 'abc' });

    expect(fakeFs.files.get(`${CACHE}/abc/my file.pdf`)).toBe('QUJDREVG');
    expect(fakeFs.copies).toEqual([{ from: `${CACHE}/abc/my file.pdf`, to: `${DOCS}/my file.pdf` }]);
    expect(fakeFs.files.get(`${DOCS}/my file.pdf`)).toBe('QUJDREVG'); // the whole file, not an empty one
    expect(sharingModule.shareAsync).not.toHaveBeenCalled();
    expect(events.onDone).toHaveBeenCalledWith({ name: 'my file.pdf', folder: 'Documents', share: expect.any(Function) });
    expect(events.onFailed).not.toHaveBeenCalled();
  });

  it('can share the saved file afterwards', async () => {
    const { receiver, events } = setup();
    await sendFile(receiver, 'abc', 'a.pdf', 'application/pdf');
    await events.onDone.mock.calls[0][0].share();
    expect(sharingModule.shareAsync).toHaveBeenCalledWith(`${CACHE}/abc/a.pdf`, { mimeType: 'application/pdf', dialogTitle: 'a.pdf' });
  });

  it('asks for a folder the first time, then uses it without asking again', async () => {
    const { receiver, store, events } = setup(folderStore(null, DOCS));
    await sendFile(receiver, 'one', 'one.pdf', 'application/pdf');
    expect(store.chooseFolder).toHaveBeenCalledTimes(1);
    expect(fakeFs.files.has(`${DOCS}/one.pdf`)).toBe(true);

    await sendFile(receiver, 'two', 'two.pdf', 'application/pdf');
    expect(store.chooseFolder).toHaveBeenCalledTimes(1);
    expect(fakeFs.files.has(`${DOCS}/two.pdf`)).toBe(true);
    expect(events.onDone).toHaveBeenCalledTimes(2);
    expect(sharingModule.shareAsync).not.toHaveBeenCalled();
  });

  it('opens the share sheet instead when the user declines to choose a folder', async () => {
    const { receiver, events } = setup(folderStore(null, null));
    await sendFile(receiver, 'abc', 'a.pdf', 'application/pdf');
    expect(fakeFs.copies).toEqual([]);
    expect(sharingModule.shareAsync).toHaveBeenCalledWith(`${CACHE}/abc/a.pdf`, expect.objectContaining({ mimeType: 'application/pdf' }));
    expect(events.onDone).toHaveBeenCalledWith(expect.objectContaining({ name: 'a.pdf', folder: null }));
  });

  it('asks again when Android has taken back access to the folder', async () => {
    fakeFs.deniedFolders.add(DOCS);
    const NEW = 'content://tree/Converter%20Tool';
    const store = folderStore(DOCS, NEW);
    const { receiver, events } = setup(store);
    await sendFile(receiver, 'abc', 'a.pdf', 'application/pdf');

    expect(store.forget).toHaveBeenCalledTimes(1);
    expect(store.chooseFolder).toHaveBeenCalledTimes(1);
    expect(fakeFs.files.has(`${NEW}/a.pdf`)).toBe(true);
    expect(events.onDone).toHaveBeenCalledWith(expect.objectContaining({ folder: 'Converter Tool' }));
    expect(sharingModule.shareAsync).not.toHaveBeenCalled();
  });

  it('falls back to the share sheet when no folder works, so the file is never lost', async () => {
    fakeFs.deniedFolders.add(DOCS);
    const { receiver, events } = setup(folderStore(DOCS, DOCS));
    await sendFile(receiver, 'abc', 'a.pdf', 'application/pdf');
    expect(sharingModule.shareAsync).toHaveBeenCalledTimes(1);
    expect(events.onDone).toHaveBeenCalledWith(expect.objectContaining({ folder: null }));
    expect(events.onFailed).not.toHaveBeenCalled();
  });

  it('adds an extension from the file type when the name has none', async () => {
    const { receiver } = setup();
    await sendFile(receiver, 'abc', 'photo', 'image/jpeg');
    expect(fakeFs.files.has(`${DOCS}/photo.jpg`)).toBe(true);
  });
});

describe('names in the folder', () => {
  it('never overwrites an earlier file, and numbers the new ones instead', async () => {
    const { receiver, events } = setup();
    await sendFile(receiver, 'one', 'report.pdf', 'application/pdf', ['QUJD']);
    await sendFile(receiver, 'two', 'report.pdf', 'application/pdf', ['REVG']);
    await sendFile(receiver, 'three', 'report.pdf', 'application/pdf', ['R0hJ']);

    expect(fakeFs.files.get(`${DOCS}/report.pdf`)).toBe('QUJD');
    expect(fakeFs.files.get(`${DOCS}/report (1).pdf`)).toBe('REVG');
    expect(fakeFs.files.get(`${DOCS}/report (2).pdf`)).toBe('R0hJ');
    expect(events.onDone.mock.calls.map(([download]) => download.name)).toEqual(['report.pdf', 'report (1).pdf', 'report (2).pdf']);
    expect(events.onFailed).not.toHaveBeenCalled();
    expect(sharingModule.shareAsync).not.toHaveBeenCalled();
  });

  it('keeps a file that was already in the folder', async () => {
    fakeFs.files.set(`${DOCS}/notes.txt`, 'ORIGINAL');
    const { receiver } = setup();
    await sendFile(receiver, 'abc', 'notes.txt', 'text/plain', ['TkVX']);
    expect(fakeFs.files.get(`${DOCS}/notes.txt`)).toBe('ORIGINAL');
    expect(fakeFs.files.get(`${DOCS}/notes (1).txt`)).toBe('TkVX');
  });

  it('numbers a name that has no extension', async () => {
    fakeFs.files.set(`${DOCS}/readme`, 'ORIGINAL');
    const { receiver } = setup();
    await sendFile(receiver, 'abc', 'readme', '', ['TkVX']);
    expect(fakeFs.files.get(`${DOCS}/readme (1)`)).toBe('TkVX');
  });

  it('shares the file under the name it was saved with', async () => {
    fakeFs.files.set(`${DOCS}/a.pdf`, 'ORIGINAL');
    const { receiver, events } = setup();
    await sendFile(receiver, 'abc', 'a.pdf', 'application/pdf');
    await events.onDone.mock.calls[0][0].share();
    expect(sharingModule.shareAsync).toHaveBeenCalledWith(`${CACHE}/abc/a (1).pdf`, expect.anything());
  });

  it('leaves no empty file behind when the folder can not be used', async () => {
    fakeFs.deniedFolders.add(DOCS);
    const { receiver } = setup(folderStore(DOCS, null));
    await sendFile(receiver, 'abc', 'a.pdf', 'application/pdf');
    expect([...fakeFs.files.keys()].filter((address) => address.startsWith(DOCS))).toEqual([]);
  });

  it('shows the folder under a readable name', async () => {
    const tree = 'content://com.android.externalstorage.documents/tree/primary%3ADocuments%2FConverter%20Tool';
    const { receiver, events } = setup(folderStore(tree));
    await sendFile(receiver, 'abc', 'a.pdf', 'application/pdf');
    expect(events.onDone).toHaveBeenCalledWith(expect.objectContaining({ folder: 'Converter Tool' }));
  });
});

describe('receiving', () => {
  it('keeps the chunks in order even when an earlier write is slower', async () => {
    fakeFs.writeDelays = [40, 0, 0];
    const { receiver } = setup();
    await receiver.handle({ type: 'download-start', id: 'slow', name: 'a.bin', mime: '' });
    // The messages arrive one after another, without waiting for the writes.
    void receiver.handle({ type: 'download-chunk', id: 'slow', data: 'AAAA' });
    void receiver.handle({ type: 'download-chunk', id: 'slow', data: 'BBBB' });
    void receiver.handle({ type: 'download-chunk', id: 'slow', data: 'CCCC' });
    await receiver.handle({ type: 'download-end', id: 'slow' });
    expect(fakeFs.files.get(`${DOCS}/a.bin`)).toBe('AAAABBBBCCCC');
  });

  it('never saves outside its own folders, whatever the page calls the file', async () => {
    const { receiver } = setup();
    await receiver.handle({ type: 'download-start', id: 'evil', name: '../../../etc/cron.d/evil.sh', mime: '' });
    const cached = [...fakeFs.files.keys()];
    expect(cached).toHaveLength(1);
    expect(cached[0].startsWith(`${CACHE}/evil/`)).toBe(true);
    // The name is one plain file name: no slashes, so it can't climb out of the folder.
    expect(cached[0].slice(`${CACHE}/evil/`.length)).not.toMatch(/[\\/]/);
    await receiver.handle({ type: 'download-end', id: 'evil' });
    const saved = fakeFs.copies[0].to;
    expect(saved.startsWith(`${DOCS}/`)).toBe(true);
    expect(saved.slice(`${DOCS}/`.length)).not.toMatch(/[\\/]/);
  });

  it('saves an empty file', async () => {
    const { receiver, events } = setup();
    await sendFile(receiver, 'e', 'empty.txt', 'text/plain', []);
    expect(fakeFs.files.get(`${DOCS}/empty.txt`)).toBe('');
    expect(events.onDone).toHaveBeenCalled();
  });

  it('keeps downloads that run at the same time apart', async () => {
    const { receiver } = setup();
    await receiver.handle({ type: 'download-start', id: 'one', name: 'one.txt', mime: '' });
    await receiver.handle({ type: 'download-start', id: 'two', name: 'two.txt', mime: '' });
    await receiver.handle({ type: 'download-chunk', id: 'one', data: 'MTEx' });
    await receiver.handle({ type: 'download-chunk', id: 'two', data: 'MjIy' });
    await receiver.handle({ type: 'download-end', id: 'two' });
    await receiver.handle({ type: 'download-end', id: 'one' });
    expect(fakeFs.files.get(`${DOCS}/one.txt`)).toBe('MTEx');
    expect(fakeFs.files.get(`${DOCS}/two.txt`)).toBe('MjIy');
  });

  it('ignores chunks and endings for a download it never started', async () => {
    const { receiver, events, store } = setup();
    await receiver.handle({ type: 'download-chunk', id: 'ghost', data: 'QUJD' });
    await receiver.handle({ type: 'download-end', id: 'ghost' });
    expect(fakeFs.files.size).toBe(0);
    expect(store.savedFolder).not.toHaveBeenCalled();
    expect(events.onDone).not.toHaveBeenCalled();
    expect(events.onFailed).not.toHaveBeenCalled();
  });
});

describe('failures', () => {
  it('reports an error from the page and removes the half-saved file', async () => {
    const { receiver, events } = setup();
    await receiver.handle({ type: 'download-start', id: 'bad', name: 'a.pdf', mime: '' });
    await receiver.handle({ type: 'download-chunk', id: 'bad', data: 'QUJD' });
    await receiver.handle({ type: 'download-error', id: 'bad', message: 'The file could not be read.' });
    expect(events.onFailed).toHaveBeenCalledWith('The file could not be read.');
    expect(fakeFs.files.size).toBe(0);
    await receiver.handle({ type: 'download-end', id: 'bad' });
    expect(fakeFs.copies).toEqual([]);
    expect(events.onDone).not.toHaveBeenCalled();
  });

  it('gives a default message when the page sends an error without one', async () => {
    const { receiver, events } = setup();
    await receiver.handle({ type: 'download-error', id: 'none', message: '' });
    expect(events.onFailed).toHaveBeenCalledWith('The file could not be prepared.');
  });

  it('reports a file that cannot be created', async () => {
    fakeFs.failCreateFile = true;
    const { receiver, events } = setup();
    await receiver.handle({ type: 'download-start', id: 'full', name: 'a.pdf', mime: '' });
    expect(events.onFailed).toHaveBeenCalledWith('disk full');
    expect(events.onStart).not.toHaveBeenCalled();
  });

  it('reports a failure to open the share sheet, when there was no folder to save in', async () => {
    sharingModule.shareAsync.mockRejectedValueOnce(new Error('No app can handle this'));
    const { receiver, events } = setup(folderStore(null, null));
    await sendFile(receiver, 's', 'a.pdf', '');
    expect(events.onFailed).toHaveBeenCalledWith('No app can handle this');
    expect(events.onDone).not.toHaveBeenCalled();
  });

  it('reports a device that cannot share, when there was no folder to save in', async () => {
    sharingModule.isAvailableAsync.mockResolvedValueOnce(false);
    const { receiver, events } = setup(folderStore(null, null));
    await sendFile(receiver, 'n', 'a.pdf', '');
    expect(events.onFailed).toHaveBeenCalledWith('Sharing is not available on this device.');
    expect(sharingModule.shareAsync).not.toHaveBeenCalled();
  });
});

describe('clearOldDownloads', () => {
  it('removes files left by earlier downloads', () => {
    fakeFs.folders.add(CACHE);
    fakeFs.folders.add(`${CACHE}/old`);
    fakeFs.files.set(`${CACHE}/old/a.pdf`, 'QUJD');
    clearOldDownloads();
    expect(fakeFs.folders.size).toBe(0);
    expect(fakeFs.files.size).toBe(0);
  });

  it('does nothing when there is nothing to remove, and never throws', () => {
    expect(() => clearOldDownloads()).not.toThrow();
    fakeFs.folders.add(CACHE);
    fakeFs.failDeleteFolder = true;
    expect(() => clearOldDownloads()).not.toThrow();
  });
});
