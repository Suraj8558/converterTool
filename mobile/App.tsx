import { useCallback, useEffect, useMemo, useRef, useState, type ForwardRefExoticComponent, type RefAttributes } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView as NativeWebView, type WebViewProps } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewHttpErrorEvent,
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes';
import { SITE_ORIGIN, SITE_URL } from './src/config';
import { DownloadReceiver, clearOldDownloads } from './src/DownloadReceiver';
import { androidFolderStore } from './src/saveFolder';
import { parseBridgeMessage } from './src/downloads';
import { DOWNLOAD_BRIDGE_SCRIPT } from './src/injected';
import { isInsideApp } from './src/navigation';

// The package's types leave out the ref that its Android WebView really supports.
interface WebViewHandle {
  goBack(): void;
  reload(): void;
}
const WebView = NativeWebView as unknown as ForwardRefExoticComponent<WebViewProps & RefAttributes<WebViewHandle>>;

const LIGHT = { background: '#ffffff', text: '#0f172a', muted: '#64748b', primary: '#2563eb' };
const DARK = { background: '#020817', text: '#f8fafc', muted: '#94a3b8', primary: '#3b82f6' };

function Message({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  const colors = useColorScheme() === 'dark' ? DARK : LIGHT;
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{body}</Text>
      {action && (
        <Pressable accessibilityRole="button" onPress={onAction} style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={styles.buttonText}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function App() {
  const colors = useColorScheme() === 'dark' ? DARK : LIGHT;
  const webView = useRef<WebViewHandle>(null);
  const canGoBack = useRef(false);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; share?: () => void } | null>(null);

  const receiver = useMemo(
    () =>
      new DownloadReceiver({
        onStart: setSaving,
        onDone: (download) => {
          setSaving(null);
          // When the file went to the share sheet instead, there is nothing more to say.
          if (!download.folder) return;
          setNotice({
            message: `Saved ${download.name} to ${download.folder}`,
            share: () => {
              download.share().catch((error: unknown) =>
                Alert.alert('Could not share the file', error instanceof Error ? error.message : 'Something went wrong.')
              );
            },
          });
        },
        onFailed: (reason) => {
          setSaving(null);
          Alert.alert('Could not save the file', reason);
        },
      }),
    []
  );

  useEffect(() => clearOldDownloads(), []);

  // The "saved" notice goes away by itself.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 10_000);
    return () => clearTimeout(timer);
  }, [notice]);

  const changeFolder = useCallback(async () => {
    const folder = await androidFolderStore.chooseFolder();
    if (folder) setNotice({ message: `Files will now be saved to ${folder.name}` });
  }, []);

  // The back button goes back through the site's pages, and leaves the app from the first one.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack.current) return false;
      webView.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, []);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseBridgeMessage(event.nativeEvent.data);
      if (message) void receiver.handle(message);
    },
    [receiver]
  );

  if (!SITE_ORIGIN) {
    return (
      <Message
        title="App not set up"
        body="This build has no website address. Set EXPO_PUBLIC_SITE_URL to the address of your deployed site, then build the app again."
      />
    );
  }

  const siteOrigin = SITE_ORIGIN;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
        <StatusBar style={colors === DARK ? 'light' : 'dark'} />
        {failed ? (
          <Message
            title="You're offline"
            body="Converter Tool needs an internet connection to load. Your files are still never uploaded."
            action="Try again"
            onAction={() => {
              setFailed(false);
              webView.current?.reload();
            }}
          />
        ) : (
          <WebView
            ref={webView}
            source={{ uri: SITE_URL }}
            style={[styles.fill, { backgroundColor: colors.background }]}
            applicationNameForUserAgent="ConverterToolApp/1.0"
            injectedJavaScriptBeforeContentLoaded={DOWNLOAD_BRIDGE_SCRIPT}
            injectedJavaScript={DOWNLOAD_BRIDGE_SCRIPT}
            onMessage={onMessage}
            onNavigationStateChange={(state: WebViewNavigation) => {
              canGoBack.current = state.canGoBack;
            }}
            onShouldStartLoadWithRequest={(request: ShouldStartLoadRequest) => {
              if (isInsideApp(request.url, siteOrigin)) return true;
              void Linking.openURL(request.url).catch(() => undefined);
              return false;
            }}
            onError={() => setFailed(true)}
            onHttpError={(event: WebViewHttpErrorEvent) => {
              if (event.nativeEvent.statusCode >= 500) setFailed(true);
            }}
            startInLoadingState
            renderLoading={() => (
              <View style={[styles.center, StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            originWhitelist={[`${siteOrigin}/*`]}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            allowFileAccess={false}
            mixedContentMode="never"
            geolocationEnabled={false}
            mediaPlaybackRequiresUserAction
          />
        )}
        {notice && (
          <View style={[styles.notice, { backgroundColor: colors.text }]}>
            <Text style={[styles.toastText, { color: colors.background }]} numberOfLines={2}>
              {notice.message}
            </Text>
            <View style={styles.noticeButtons}>
              {notice.share && (
                <Pressable accessibilityRole="button" onPress={notice.share} hitSlop={8}>
                  <Text style={[styles.noticeButton, { color: colors.background }]}>Share</Text>
                </Pressable>
              )}
              <Pressable accessibilityRole="button" onPress={() => void changeFolder()} hitSlop={8}>
                <Text style={[styles.noticeButton, { color: colors.background }]}>Change folder</Text>
              </Pressable>
            </View>
          </View>
        )}
        {saving && (
          <View style={[styles.toast, { backgroundColor: colors.text }]} pointerEvents="none">
            <Text style={[styles.toastText, { color: colors.background }]} numberOfLines={1}>
              Preparing {saving}…
            </Text>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  button: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  toast: { position: 'absolute', bottom: 24, left: 24, right: 24, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  toastText: { fontSize: 14, textAlign: 'center' },
  notice: { position: 'absolute', bottom: 24, left: 24, right: 24, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, gap: 8 },
  noticeButtons: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  noticeButton: { fontSize: 15, fontWeight: '700', paddingVertical: 4, textDecorationLine: 'underline' },
});
