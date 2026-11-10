import { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';

/** What the app asked of the WebView, so tests can read its props and call its handlers. */
export const webViewState: { props: Record<string, any> | null; mounts: number; goBack: jest.Mock; reload: jest.Mock } = {
  props: null,
  mounts: 0,
  goBack: jest.fn(),
  reload: jest.fn(),
};

export const FakeWebView = forwardRef(function FakeWebView(props: Record<string, any>, ref) {
  webViewState.props = props;
  useImperativeHandle(ref, () => ({ goBack: webViewState.goBack, reload: webViewState.reload }));
  return <View testID="webview" />;
});

export function resetWebView() {
  webViewState.props = null;
  webViewState.goBack.mockClear();
  webViewState.reload.mockClear();
}
