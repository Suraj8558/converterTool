import type { ExpoConfig } from 'expo/config';

// The Android package name identifies the app on Google Play and cannot change after the
// first release. Change it here before publishing.
const config: ExpoConfig = {
  name: 'Converter Tool',
  // Must match the slug of the Expo project the ID below belongs to, or EAS refuses to build.
  slug: 'suraj-kumar',
  version: '1.0.0',
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  android: {
    package: 'com.convertertool.app',
    adaptiveIcon: {
      backgroundImage: './assets/android-icon-background.png',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // The app picks files with Android's own file chooser and saves through the share
    // sheet, so it needs none of the storage, overlay or vibration permissions Expo adds.
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.VIBRATE',
    ],
  },
  // The Expo account (here a team) that owns the project below.
  owner: 'suraj8558s-team',
  // The Expo project this app builds under. It is an identifier, not a secret.
  extra: { eas: { projectId: 'ab58c12e-1693-4eca-9ca9-f149f6e51223' } },
  plugins: [
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 160,
        backgroundColor: '#ffffff',
        dark: { backgroundColor: '#020817' },
      },
    ],
  ],
};

export default config;
