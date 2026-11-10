const load = (url: string | undefined, dev: boolean) => {
  jest.resetModules();
  if (url === undefined) delete process.env.EXPO_PUBLIC_SITE_URL;
  else process.env.EXPO_PUBLIC_SITE_URL = url;
  (globalThis as { __DEV__?: boolean }).__DEV__ = dev;
  return require('../src/config') as { SITE_URL: string; SITE_ORIGIN: string | null };
};

afterAll(() => {
  delete process.env.EXPO_PUBLIC_SITE_URL;
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;
});

describe('site address', () => {
  it('uses the address the app was built with', () => {
    expect(load('https://converter.example.com', false)).toEqual({
      SITE_URL: 'https://converter.example.com',
      SITE_ORIGIN: 'https://converter.example.com',
    });
  });

  it('ignores spaces around the address', () => {
    expect(load('  https://converter.example.com/ \n', false).SITE_ORIGIN).toBe('https://converter.example.com');
  });

  it('has no address in a release build that was given none', () => {
    expect(load(undefined, false)).toEqual({ SITE_URL: '', SITE_ORIGIN: null });
    expect(load('   ', false).SITE_ORIGIN).toBeNull();
  });

  it('reaches the computer’s dev server from an emulator while developing', () => {
    expect(load(undefined, true)).toEqual({ SITE_URL: 'http://10.0.2.2:9002', SITE_ORIGIN: 'http://10.0.2.2:9002' });
  });

  it('refuses an address that is not a web address', () => {
    expect(load('javascript:alert(1)', false).SITE_ORIGIN).toBeNull();
    expect(load('file:///etc/passwd', false).SITE_ORIGIN).toBeNull();
    expect(load('converter.example.com', false).SITE_ORIGIN).toBeNull();
  });
});
