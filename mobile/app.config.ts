import type { ExpoConfig } from 'expo/config';

// The Android package name identifies the app on Google Play and cannot change after the
// first release. Change it here before publishing.
const config: ExpoConfig = {
  name: 'Converter Tool',
  slug: 'converter-tool',
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
