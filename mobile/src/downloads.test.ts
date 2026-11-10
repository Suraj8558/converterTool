import { describe, expect, it } from 'vitest';
import { folderLabel, isAlreadyExists, numberedName, parseBridgeMessage, safeFileName } from './downloads';

const send = (message: unknown) => parseBridgeMessage(JSON.stringify(message));

describe('parseBridgeMessage', () => {
  it('accepts each kind of message', () => {
    expect(send({ type: 'download-start', id: 'abc123', name: 'a.png', mime: 'image/png' })).toEqual({
      type: 'download-start', id: 'abc123', name: 'a.png', mime: 'image/png',
    });
    expect(send({ type: 'download-chunk', id: 'abc123', data: 'QUJD' })).toEqual({ type: 'download-chunk', id: 'abc123', data: 'QUJD' });
    expect(send({ type: 'download-chunk', id: 'abc123', data: '' })).toEqual({ type: 'download-chunk', id: 'abc123', data: '' });
    expect(send({ type: 'download-end', id: 'abc123' })).toEqual({ type: 'download-end', id: 'abc123' });
    expect(send({ type: 'download-error', id: 'abc123', message: 'boom' })).toEqual({ type: 'download-error', id: 'abc123', message: 'boom' });
  });

  it('copes with a missing file type', () => {
    expect(send({ type: 'download-start', id: 'a', name: 'x' })).toMatchObject({ mime: '' });
  });

  it('ignores anything that is not a well-formed message', () => {
    expect(parseBridgeMessage('not json')).toBeNull();
    expect(parseBridgeMessage('null')).toBeNull();
    expect(parseBridgeMessage('"text"')).toBeNull();
    expect(send({ type: 'something-else', id: 'a' })).toBeNull();
    expect(send({ type: 'download-end' })).toBeNull();
    expect(send({ type: 'download-start', id: 'a', name: 5 })).toBeNull();
  });

  it('refuses ids that could escape the downloads folder', () => {
    expect(send({ type: 'download-end', id: '../../etc' })).toBeNull();
    expect(send({ type: 'download-end', id: 'a/b' })).toBeNull();
    expect(send({ type: 'download-end', id: '' })).toBeNull();
    expect(send({ type: 'download-end', id: 'x'.repeat(41) })).toBeNull();
  });

  it('refuses chunks that are not base64', () => {
    expect(send({ type: 'download-chunk', id: 'a', data: 'not base64!' })).toBeNull();
    expect(send({ type: 'download-chunk', id: 'a', data: 5 })).toBeNull();
  });

  it('shortens very long error messages', () => {
    const message = send({ type: 'download-error', id: 'a', message: 'x'.repeat(5000) });
    expect(message?.type === 'download-error' && message.message.length).toBe(200);
  });
});

describe('safeFileName', () => {
  it('keeps ordinary names', () => {
    expect(safeFileName('photo_passport_sheet.pdf')).toBe('photo_passport_sheet.pdf');
    expect(safeFileName('Résumé 2026 (final).docx')).toBe('Résumé 2026 (final).docx');
  });

  it('removes folders and odd characters', () => {
    expect(safeFileName('../../etc/passwd')).toBe('_.._etc_passwd');
    expect(safeFileName('a\\b:c*d?.png')).toBe('a_b_c_d_.png');
    expect(safeFileName('bad\u0000name\n.png')).toBe('badname.png');
  });

  it('does not make hidden files', () => {
    expect(safeFileName('.htaccess')).toBe('htaccess');
    expect(safeFileName('...')).toBe('download');
  });

  it('falls back when nothing is left', () => {
    expect(safeFileName('')).toBe('download');
    expect(safeFileName('   ')).toBe('download');
  });

  it('adds an extension from the file type when the name has none', () => {
    expect(safeFileName('merged', 'application/pdf')).toBe('merged.pdf');
    expect(safeFileName('photo', 'image/jpeg')).toBe('photo.jpg');
    expect(safeFileName('video', 'video/mp4; codecs=avc1')).toBe('video.mp4');
    expect(safeFileName('a.png', 'image/jpeg')).toBe('a.png');
    expect(safeFileName('mystery', 'application/x-unknown')).toBe('mystery');
  });

  it('shortens long names but keeps the extension', () => {
    const name = safeFileName(`${'a'.repeat(300)}.pdf`);
    expect(name.length).toBe(120);
    expect(name.endsWith('.pdf')).toBe(true);
  });
});

describe('numberedName', () => {
  it('puts the number before the extension', () => {
    expect(numberedName('report.pdf', 1)).toBe('report (1).pdf');
    expect(numberedName('archive.tar.gz', 2)).toBe('archive.tar (2).gz');
  });

  it('numbers a name with no extension, and ignores a dot that does not start one', () => {
    expect(numberedName('readme', 3)).toBe('readme (3)');
    expect(numberedName('.hidden', 1)).toBe('.hidden (1)');
    expect(numberedName('a.b very long suffix', 1)).toBe('a.b very long suffix (1)');
  });
});

describe('isAlreadyExists', () => {
  it('recognises the file system saying the destination exists', () => {
    expect(isAlreadyExists(new Error('Destination already exists'))).toBe(true);
    expect(isAlreadyExists({ code: 'ERR_DESTINATION_ALREADY_EXISTS', message: '' })).toBe(true);
  });

  it('does not take other errors for it', () => {
    expect(isAlreadyExists(new Error('Permission denied'))).toBe(false);
    expect(isAlreadyExists(new Error('The disk is full'))).toBe(false);
    expect(isAlreadyExists(undefined)).toBe(false);
    expect(isAlreadyExists('Destination already exists')).toBe(false);
  });
});

describe('folderLabel', () => {
  const tree = (id: string) => `content://com.android.externalstorage.documents/tree/${id}`;

  it('names the last folder of the path', () => {
    expect(folderLabel(tree('primary%3ADocuments'))).toBe('Documents');
    expect(folderLabel(tree('primary%3ADocuments%2FConverter%20Tool'))).toBe('Converter Tool');
    expect(folderLabel(tree('1A2B-3C4D%3APhotos%2F2026'))).toBe('2026');
  });

  it('names a whole storage when the root was chosen', () => {
    expect(folderLabel(tree('primary%3A'))).toBe('Internal storage');
    expect(folderLabel(tree('1A2B-3C4D%3A'))).toBe('Storage');
  });

  it('copes with a document address inside the tree and a trailing slash', () => {
    expect(folderLabel(`${tree('primary%3ADocuments')}/document/primary%3ADocuments%2Fx.pdf`)).toBe('Documents');
    expect(folderLabel(`${tree('primary%3ADocuments')}/`)).toBe('Documents');
  });

  it('copes with addresses that are not Android trees', () => {
    expect(folderLabel('content://tree/Converter%20Tool')).toBe('Converter Tool');
    expect(folderLabel('file:///storage/Pictures/')).toBe('Pictures');
    expect(folderLabel('')).toBe('the chosen folder');
  });
});
