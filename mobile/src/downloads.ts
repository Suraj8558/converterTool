// What the web page sends to the app when the user saves a file. The page cuts the file
// into chunks, because one big message could run the phone out of memory. Kept free of
// React Native imports so it can be tested on its own.

export type BridgeMessage =
  | { type: 'download-start'; id: string; name: string; mime: string }
  | { type: 'download-chunk'; id: string; data: string }
  | { type: 'download-end'; id: string }
  | { type: 'download-error'; id: string; message: string };

const ID_PATTERN = /^[A-Za-z0-9]{1,40}$/;
const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

/** Reads a message from the page, returning null for anything that isn't a well-formed one. */
export function parseBridgeMessage(raw: string): BridgeMessage | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const message = value as Record<string, unknown>;
  if (typeof message.id !== 'string' || !ID_PATTERN.test(message.id)) return null;
  const id = message.id;

  switch (message.type) {
    case 'download-start':
      if (typeof message.name !== 'string') return null;
      return { type: 'download-start', id, name: message.name, mime: typeof message.mime === 'string' ? message.mime : '' };
    case 'download-chunk':
      if (typeof message.data !== 'string' || !BASE64_PATTERN.test(message.data)) return null;
      return { type: 'download-chunk', id, data: message.data };
    case 'download-end':
      return { type: 'download-end', id };
    case 'download-error':
      return { type: 'download-error', id, message: typeof message.message === 'string' ? message.message.slice(0, 200) : '' };
    default:
      return null;
  }
}

const EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'video/mp4': 'mp4',
  'video/x-msvideo': 'avi',
};

const MAX_NAME_LENGTH = 120;

/**
 * A file name that is safe to create in the app's own folder: no folders, no hidden
 * files, no odd characters. Adds an extension from the file type when the name has none.
 */
export function safeFileName(name: string, mime = ''): string {
  let clean = name
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/^\.+/, '')
    .trim();
  if (clean.length > MAX_NAME_LENGTH) {
    const dot = clean.lastIndexOf('.');
    const extension = dot > 0 && clean.length - dot <= 10 ? clean.slice(dot) : '';
    clean = clean.slice(0, MAX_NAME_LENGTH - extension.length) + extension;
  }
  if (!clean) clean = 'download';
  const extension = EXTENSIONS[mime.split(';')[0].trim().toLowerCase()];
  if (extension && !/\.[A-Za-z0-9]{1,8}$/.test(clean)) clean += `.${extension}`;
  return clean;
}

/** "report.pdf" becomes "report (2).pdf": the name to try when the first one is taken. */
export function numberedName(name: string, number: number): string {
  const dot = name.lastIndexOf('.');
  const hasExtension = dot > 0 && name.length - dot <= 10;
  const stem = hasExtension ? name.slice(0, dot) : name;
  const extension = hasExtension ? name.slice(dot) : '';
  return `${stem} (${number})${extension}`;
}

/** True for the error Expo's file system gives when the destination already has a file of that name. */
export function isAlreadyExists(error: unknown): boolean {
  const { code, message } = (error ?? {}) as { code?: unknown; message?: unknown };
  return /already exists|already_exists/i.test(`${String(code ?? '')} ${String(message ?? '')}`);
}

/**
 * A folder's name for people, from the address Android's folder picker gives. Those addresses
 * hold an encoded path, such as .../tree/primary%3ADocuments%2FConverter%20Tool, which is
 * the folder "Converter Tool" inside Documents on the phone's own storage.
 */
export function folderLabel(uri: string): string {
  const decode = (text: string) => {
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  };
  const tree = /\/tree\/([^/]+)/.exec(uri);
  const id = decode(tree ? tree[1] : (uri.replace(/\/+$/, '').split('/').pop() ?? ''));
  const colon = id.indexOf(':');
  const path = colon >= 0 ? id.slice(colon + 1) : id;
  if (colon >= 0 && path === '') return id.startsWith('primary') ? 'Internal storage' : 'Storage';
  return path.split('/').filter(Boolean).pop() || 'the chosen folder';
}
