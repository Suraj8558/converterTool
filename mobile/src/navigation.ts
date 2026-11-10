// Decides which addresses may load inside the app and which are handed to Android.
// Kept free of React Native imports so it can be tested on its own.

/** The origin of a web address, or null unless it is a usable http(s) address. */
export function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.origin : null;
  } catch {
    return null;
  }
}

/**
 * True for pages of the site itself, and for the blob: and about: addresses the page
 * creates for its own previews. Everything else, such as other websites, mailto: and tel:
 * links, is opened outside the app.
 */
export function isInsideApp(url: string, siteOrigin: string): boolean {
  if (url === 'about:blank' || url === 'about:srcdoc') return true;
  if (url.startsWith('blob:')) return url.startsWith(`blob:${siteOrigin}/`);
  return originOf(url) === siteOrigin;
}
