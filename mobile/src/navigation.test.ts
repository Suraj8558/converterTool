import { describe, expect, it } from 'vitest';
import { isInsideApp, originOf } from './navigation';

const SITE = 'https://converter.example.com';

describe('originOf', () => {
  it('reads the origin of web addresses', () => {
    expect(originOf('https://converter.example.com/pdf-merge?x=1')).toBe(SITE);
    expect(originOf('http://10.0.2.2:9002/')).toBe('http://10.0.2.2:9002');
  });

  it('rejects anything that is not a usable web address', () => {
    expect(originOf(undefined)).toBeNull();
    expect(originOf('')).toBeNull();
    expect(originOf('not a url')).toBeNull();
    expect(originOf('javascript:alert(1)')).toBeNull();
    expect(originOf('file:///etc/passwd')).toBeNull();
    expect(originOf('mailto:a@b.co')).toBeNull();
  });
});

describe('isInsideApp', () => {
  it('keeps the site’s own pages inside the app', () => {
    expect(isInsideApp(`${SITE}/`, SITE)).toBe(true);
    expect(isInsideApp(`${SITE}/privacy#top`, SITE)).toBe(true);
  });

  it('keeps blob and about pages the site makes for itself', () => {
    expect(isInsideApp(`blob:${SITE}/3f2a`, SITE)).toBe(true);
    expect(isInsideApp('about:blank', SITE)).toBe(true);
  });

  it('opens everything else outside the app', () => {
    expect(isInsideApp('https://example.org/', SITE)).toBe(false);
    expect(isInsideApp('mailto:hello@example.com', SITE)).toBe(false);
    expect(isInsideApp('tel:+123456789', SITE)).toBe(false);
    expect(isInsideApp('intent://scan/#Intent;scheme=zxing;end', SITE)).toBe(false);
    expect(isInsideApp('blob:https://evil.example/3f2a', SITE)).toBe(false);
  });

  it('is not fooled by look-alike addresses', () => {
    expect(isInsideApp('https://converter.example.com.evil.io/', SITE)).toBe(false);
    expect(isInsideApp('https://evil.io/?next=https://converter.example.com/', SITE)).toBe(false);
    expect(isInsideApp('http://converter.example.com/', SITE)).toBe(false);
    expect(isInsideApp('https://converter.example.com:8443/', SITE)).toBe(false);
    expect(isInsideApp('https://user@evil.io@converter.example.com/', SITE)).toBe(true); // Really the site.
  });
});
