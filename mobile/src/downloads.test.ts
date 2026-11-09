import { describe, expect, it } from 'vitest';
import { parseBridgeMessage, safeFileName } from './downloads';

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
