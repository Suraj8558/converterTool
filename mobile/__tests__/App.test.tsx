import { Alert, BackHandler, Linking } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';
import { DOWNLOAD_BRIDGE_SCRIPT } from '../src/injected';
import { fakeFs, sharingModule } from './support/fakeNative';
import { FakeWebView, resetWebView, webViewState } from './support/fakeWebView';

const SITE = 'https://converter.example.com';
const site = { url: SITE, origin: SITE as string | null };

jest.mock('../src/config', () => ({
  get SITE_URL() {
    return site.url;
  },
  get SITE_ORIGIN() {
    return site.origin;
  },
}));
jest.mock('react-native-webview', () => ({ WebView: require('./support/fakeWebView').FakeWebView }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-file-system', () => require('./support/fakeNative').fileSystemModule);
jest.mock('expo-sharing', () => require('./support/fakeNative').sharingModule);

const props = () => webViewState.props!;
const send = (message: unknown) => act(async () => props().onMessage({ nativeEvent: { data: JSON.stringify(message) } }));

let backHandlers: (() => boolean)[];

beforeEach(() => {
  site.url = SITE;
  site.origin = SITE;
  resetWebView();
  fakeFs.reset();
  sharingModule.isAvailableAsync.mockClear().mockResolvedValue(true);
  sharingModule.shareAsync.mockClear().mockResolvedValue(undefined);
  backHandlers = [];
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    backHandlers.push(handler as () => boolean);
    return { remove: jest.fn() };
  });
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('setup', () => {
  it('says the app is not set up, instead of loading nothing, when there is no site address', async () => {
    site.url = '';
    site.origin = null;
    await render(<App />);
    expect(screen.getByText('App not set up')).toBeOnTheScreen();
    expect(screen.getByText(/EXPO_PUBLIC_SITE_URL/)).toBeOnTheScreen();
    expect(webViewState.props).toBeNull();
  });

  it('loads the site in the WebView with the download script and safe settings', async () => {
    await render(<App />);
    expect(screen.getByTestId('webview')).toBeOnTheScreen();
    expect(props().source).toEqual({ uri: SITE });
    expect(props().injectedJavaScriptBeforeContentLoaded).toBe(DOWNLOAD_BRIDGE_SCRIPT);
    expect(props().injectedJavaScript).toBe(DOWNLOAD_BRIDGE_SCRIPT);
    expect(props()).toMatchObject({
      javaScriptEnabled: true,
      domStorageEnabled: true,
      allowFileAccess: false,
      mixedContentMode: 'never',
      geolocationEnabled: false,
      setSupportMultipleWindows: false,
      originWhitelist: [`${SITE}/*`],
    });
  });
});

describe('links', () => {
  it('keeps the site’s own pages, and its blob previews, inside the app', async () => {
    await render(<App />);
    expect(props().onShouldStartLoadWithRequest({ url: `${SITE}/pdf-merge` })).toBe(true);
    expect(props().onShouldStartLoadWithRequest({ url: `blob:${SITE}/1234` })).toBe(true);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('opens other websites, email and phone links outside the app', async () => {
    await render(<App />);
    for (const url of ['https://example.org/page', 'mailto:hello@example.com', 'tel:+123456789']) {
      expect(props().onShouldStartLoadWithRequest({ url })).toBe(false);
      expect(Linking.openURL).toHaveBeenLastCalledWith(url);
    }
  });

  it('does not crash when Android has no app for a link', async () => {
    (Linking.openURL as jest.Mock).mockRejectedValue(new Error('No app'));
    await render(<App />);
    expect(props().onShouldStartLoadWithRequest({ url: 'mailto:a@b.co' })).toBe(false);
    await act(async () => {});
    expect(screen.getByTestId('webview')).toBeOnTheScreen();
  });
});

describe('offline screen', () => {
  it('shows when the page cannot load, and "Try again" brings the site back', async () => {
    await render(<App />);
    await act(async () => props().onError({ nativeEvent: {} }));
    expect(screen.getByText("You're offline")).toBeOnTheScreen();
    expect(screen.queryByTestId('webview')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.queryByText("You're offline")).toBeNull();
    expect(screen.getByTestId('webview')).toBeOnTheScreen();
    expect(props().source).toEqual({ uri: SITE });
  });

  it('shows for server errors, but not for a missing page', async () => {
    await render(<App />);
    await act(async () => props().onHttpError({ nativeEvent: { statusCode: 404 } }));
    expect(screen.queryByText("You're offline")).toBeNull();
    await act(async () => props().onHttpError({ nativeEvent: { statusCode: 503 } }));
    expect(screen.getByText("You're offline")).toBeOnTheScreen();
  });
});

describe('back button', () => {
  it('leaves the app from the first page', async () => {
    await render(<App />);
    expect(backHandlers).toHaveLength(1);
    expect(backHandlers[0]()).toBe(false); // false lets Android close the app
    expect(webViewState.goBack).not.toHaveBeenCalled();
  });

  it('goes back through the site’s pages first', async () => {
    await render(<App />);
    await act(async () => props().onNavigationStateChange({ canGoBack: true }));
    expect(backHandlers[0]()).toBe(true);
    expect(webViewState.goBack).toHaveBeenCalledTimes(1);

    await act(async () => props().onNavigationStateChange({ canGoBack: false }));
    expect(backHandlers[0]()).toBe(false);
  });

  it('stops listening when the app closes', async () => {
    const remove = jest.fn();
    (BackHandler.addEventListener as jest.Mock).mockReturnValue({ remove });
    const { unmount } = await render(<App />);
    await unmount();
    expect(remove).toHaveBeenCalled();
  });
});

describe('saving files', () => {
  it('shows what it is preparing and opens the share sheet when the file is ready', async () => {
    await render(<App />);
    await send({ type: 'download-start', id: 'abc', name: 'merged.pdf', mime: 'application/pdf' });
    expect(screen.getByText('Preparing merged.pdf…')).toBeOnTheScreen();

    await send({ type: 'download-chunk', id: 'abc', data: 'QUJD' });
    await send({ type: 'download-end', id: 'abc' });
    expect(sharingModule.shareAsync).toHaveBeenCalledWith(
      'file:///cache/downloads/abc/merged.pdf',
      expect.objectContaining({ mimeType: 'application/pdf' })
    );
    expect(screen.queryByText(/Preparing/)).toBeNull();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('tells the user when a file cannot be saved', async () => {
    await render(<App />);
    await send({ type: 'download-start', id: 'bad', name: 'a.pdf', mime: '' });
    await send({ type: 'download-error', id: 'bad', message: 'The file could not be read.' });
    expect(Alert.alert).toHaveBeenCalledWith('Could not save the file', 'The file could not be read.');
    expect(screen.queryByText(/Preparing/)).toBeNull();
  });

  it('tells the user when the share sheet fails', async () => {
    sharingModule.shareAsync.mockRejectedValueOnce(new Error('No app can handle this'));
    await render(<App />);
    await send({ type: 'download-start', id: 's', name: 'a.pdf', mime: '' });
    await send({ type: 'download-end', id: 's' });
    expect(Alert.alert).toHaveBeenCalledWith('Could not save the file', 'No app can handle this');
  });

  it('ignores anything from the page that is not a valid message', async () => {
    await render(<App />);
    await act(async () => props().onMessage({ nativeEvent: { data: 'not json' } }));
    await send({ type: 'download-start', id: '../../x', name: 'a.pdf' });
    await send({ type: 'unknown', id: 'abc' });
    expect(screen.queryByText(/Preparing/)).toBeNull();
    expect(fakeFs.files.size).toBe(0);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('clears files left from an earlier visit when it starts', async () => {
    fakeFs.folders.add('file:///cache/downloads');
    fakeFs.files.set('file:///cache/downloads/old/a.pdf', 'QUJD');
    await render(<App />);
    expect(fakeFs.files.size).toBe(0);
  });
});
