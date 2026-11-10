import { DownloadReceiver, clearOldDownloads, type DownloadEvents } from '../src/DownloadReceiver';
import { fakeFs, sharingModule } from './support/fakeNative';

jest.mock('expo-file-system', () => require('./support/fakeNative').fileSystemModule);
jest.mock('expo-sharing', () => require('./support/fakeNative').sharingModule);

const FOLDER = 'file:///cache/downloads';

function setup() {
  const events = { onStart: jest.fn(), onDone: jest.fn(), onFailed: jest.fn() } satisfies DownloadEvents;
  return { events, receiver: new DownloadReceiver(events) };
}

beforeEach(() => {
  fakeFs.reset();
  sharingModule.isAvailableAsync.mockClear().mockResolvedValue(true);
  sharingModule.shareAsync.mockClear().mockResolvedValue(undefined);
});

describe('DownloadReceiver', () => {
  it('puts the chunks together, saves the file and opens the share sheet', async () => {
    const { receiver, events } = setup();
    await receiver.handle({ type: 'download-start', id: 'abc', name: 'my file.pdf', mime: 'application/pdf' });
    expect(events.onStart).toHaveBeenCalledWith('my file.pdf');
    await receiver.handle({ type: 'download-chunk', id: 'abc', data: 'QUJD' });
    await receiver.handle({ type: 'download-chunk', id: 'abc', data: 'REVG' });
    await receiver.handle({ type: 'download-end', id: 'abc' });

    expect(fakeFs.files.get(`${FOLDER}/abc/my file.pdf`)).toBe('QUJDREVG');
    expect(sharingModule.shareAsync).toHaveBeenCalledWith(`${FOLDER}/abc/my file.pdf`, {
      mimeType: 'application/pdf',
      dialogTitle: 'my file.pdf',
    });
    expect(events.onDone).toHaveBeenCalledTimes(1);
    expect(events.onFailed).not.toHaveBeenCalled();
  });

  it('keeps the chunks in order even when an earlier write is slower', async () => {
    fakeFs.writeDelays = [40, 0, 0];
    const { receiver } = setup();
    await receiver.handle({ type: 'download-start', id: 'slow', name: 'a.bin', mime: '' });
    // The messages arrive one after another, without waiting for the writes.
    void receiver.handle({ type: 'download-chunk', id: 'slow', data: 'AAAA' });
    void receiver.handle({ type: 'download-chunk', id: 'slow', data: 'BBBB' });
    void receiver.handle({ type: 'download-chunk', id: 'slow', data: 'CCCC' });
    await receiver.handle({ type: 'download-end', id: 'slow' });
    expect(fakeFs.files.get(`${FOLDER}/slow/a.bin`)).toBe('AAAABBBBCCCC');
  });

  it('adds an extension from the file type and does not pass an empty type to the share sheet', async () => {
    const { receiver } = setup();
    await receiver.handle({ type: 'download-start', id: 'x1', name: 'photo', mime: 'image/jpeg' });
    await receiver.handle({ type: 'download-end', id: 'x1' });
    expect(sharingModule.shareAsync).toHaveBeenCalledWith(`${FOLDER}/x1/photo.jpg`, expect.objectContaining({ mimeType: 'image/jpeg' }));

    await receiver.handle({ type: 'download-start', id: 'x2', name: 'mystery', mime: '' });
    await receiver.handle({ type: 'download-end', id: 'x2' });
    expect(sharingModule.shareAsync).toHaveBeenLastCalledWith(`${FOLDER}/x2/mystery`, expect.objectContaining({ mimeType: undefined }));
  });

  it('never saves outside its own folder, whatever the page calls the file', async () => {
    const { receiver } = setup();
    await receiver.handle({ type: 'download-start', id: 'evil', name: '../../../etc/cron.d/evil.sh', mime: '' });
    const saved = [...fakeFs.files.keys()];
    expect(saved).toHaveLength(1);
    expect(saved[0].startsWith(`${FOLDER}/evil/`)).toBe(true);
    // The name is one plain file name: no slashes, so it can't climb out of the folder.
    expect(saved[0].slice(`${FOLDER}/evil/`.length)).not.toMatch(/[\\/]/);
  });

  it('saves an empty file', async () => {
    const { receiver, events } = setup();
    await receiver.handle({ type: 'download-start', id: 'e', name: 'empty.txt', mime: 'text/plain' });
    await receiver.handle({ type: 'download-end', id: 'e' });
    expect(fakeFs.files.get(`${FOLDER}/e/empty.txt`)).toBe('');
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
    expect(fakeFs.files.get(`${FOLDER}/one/one.txt`)).toBe('MTEx');
    expect(fakeFs.files.get(`${FOLDER}/two/two.txt`)).toBe('MjIy');
    expect(sharingModule.shareAsync).toHaveBeenCalledTimes(2);
  });

  it('ignores chunks and endings for a download it never started', async () => {
    const { receiver, events } = setup();
    await receiver.handle({ type: 'download-chunk', id: 'ghost', data: 'QUJD' });
    await receiver.handle({ type: 'download-end', id: 'ghost' });
    expect(fakeFs.files.size).toBe(0);
    expect(sharingModule.shareAsync).not.toHaveBeenCalled();
    expect(events.onDone).not.toHaveBeenCalled();
    expect(events.onFailed).not.toHaveBeenCalled();
  });

  it('reports an error from the page and removes the half-saved file', async () => {
    const { receiver, events } = setup();
    await receiver.handle({ type: 'download-start', id: 'bad', name: 'a.pdf', mime: '' });
    await receiver.handle({ type: 'download-chunk', id: 'bad', data: 'QUJD' });
    await receiver.handle({ type: 'download-error', id: 'bad', message: 'The file could not be read.' });
    expect(events.onFailed).toHaveBeenCalledWith('The file could not be read.');
    expect(fakeFs.files.size).toBe(0);
    await receiver.handle({ type: 'download-end', id: 'bad' });
    expect(sharingModule.shareAsync).not.toHaveBeenCalled();
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

  it('reports a failure to open the share sheet', async () => {
    sharingModule.shareAsync.mockRejectedValueOnce(new Error('No app can handle this'));
    const { receiver, events } = setup();
    await receiver.handle({ type: 'download-start', id: 's', name: 'a.pdf', mime: '' });
    await receiver.handle({ type: 'download-end', id: 's' });
    expect(events.onFailed).toHaveBeenCalledWith('No app can handle this');
    expect(events.onDone).not.toHaveBeenCalled();
  });

  it('reports a device that cannot share', async () => {
    sharingModule.isAvailableAsync.mockResolvedValueOnce(false);
    const { receiver, events } = setup();
    await receiver.handle({ type: 'download-start', id: 'n', name: 'a.pdf', mime: '' });
    await receiver.handle({ type: 'download-end', id: 'n' });
    expect(events.onFailed).toHaveBeenCalledWith('Sharing is not available on this device.');
    expect(sharingModule.shareAsync).not.toHaveBeenCalled();
  });
});

describe('clearOldDownloads', () => {
  it('removes files left by earlier downloads', () => {
    fakeFs.folders.add(FOLDER);
    fakeFs.folders.add(`${FOLDER}/old`);
    fakeFs.files.set(`${FOLDER}/old/a.pdf`, 'QUJD');
    clearOldDownloads();
    expect(fakeFs.folders.size).toBe(0);
    expect(fakeFs.files.size).toBe(0);
  });

  it('does nothing when there is nothing to remove, and never throws', () => {
    expect(() => clearOldDownloads()).not.toThrow();
    fakeFs.folders.add(FOLDER);
    fakeFs.failDeleteFolder = true;
    expect(() => clearOldDownloads()).not.toThrow();
  });
});
