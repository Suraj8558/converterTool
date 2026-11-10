# Converter Tool for Android

An [Expo](https://expo.dev) app that shows the deployed Converter Tool website in a
WebView. Every tool works as it does in the browser, and files are still processed on the
phone and never uploaded.

The app adds what a WebView does not do on its own:

- **Saving files.** Android's WebView can't save the `blob:` links the tools make for their
  results. The app catches them and receives the file in small chunks. The first time, it asks
  the user to choose a folder (Android doesn't let apps use the Downloads folder itself, so
  they pick Documents or make one such as "Converter Tool"). Android remembers the choice, so
  later downloads save there straight away, and a notice offers **Share** and **Change
  folder**. If the user would rather not choose a folder, the file opens in Android's share
  sheet instead, so it is never lost. If the folder already has a file with that name, the new one is saved as "name (1)", "name (2)" and so on, and nothing is overwritten.
- **Back button.** It goes back through the site's pages, and leaves the app from the first one.
- **Links.** Pages of the site stay in the app. Other websites, `mailto:` and `tel:` links
  open in Android's own apps.
- **Offline screen** with a "Try again" button, and light and dark colours that follow the phone.

It needs an internet connection, because the site is loaded from your server. It is not a
copy of the site bundled inside the app.

## Set up

1. **Deploy the website** (see [../docs/deployment.md](../docs/deployment.md)) and note its address.
2. **Install:**
   ```bash
   cd mobile
   npm install
   ```
3. **Set the address** the app loads. It is read when the app is built:
   ```bash
   export EXPO_PUBLIC_SITE_URL=https://your-site.example.com
   ```
   A build without it shows an "App not set up" screen instead of a website.

## Try it

- **On a phone with Expo Go:** `npx expo start`, then scan the QR code. Use your deployed site's address.
- **On an Android emulator with the site running locally:** start the web app with `npm run dev`
  in the project root, then run `npx expo start --android` here. In development, with no
  address set, the app loads `http://10.0.2.2:9002`, which is how an emulator reaches your computer.

## Build the APK

Builds run on Expo's servers with [EAS](https://docs.expo.dev/build/introduction/), so you
need no Android tools, only a free Expo account.

```bash
npx eas-cli@latest login
npx eas-cli@latest init          # links the app to your Expo account
```

`init` prints a project ID. Add it to [`app.config.ts`](app.config.ts):

```ts
extra: { eas: { projectId: '<the ID it printed>' } },
```

Then give the build the site's address and start it:

```bash
npx eas-cli@latest env:set --name EXPO_PUBLIC_SITE_URL --value https://your-site.example.com \
  --environment preview --environment production --visibility plaintext
npx eas-cli@latest build --platform android --profile preview
```

When it finishes, EAS gives a link to an `.apk` you can install on a phone to try the app.

### Publish on Google Play

The command above already set the address for `production` too. Then:

```bash
npx eas-cli@latest build --platform android --profile production   # makes an .aab
npx eas-cli@latest submit --platform android
```

Before the first release, check:

- **Package name.** `com.convertertool.app` in [`app.config.ts`](app.config.ts) is a placeholder.
  It identifies the app on Google Play and can't change after the first release.
- **Privacy policy.** Google Play asks for a web address. Use the site's `/privacy` page.
- **Signing.** EAS creates and stores the signing key the first time you build. Keep it safe.
- **Permissions.** The app asks only for internet access. Storage, overlay and vibration
  permissions that Expo adds by default are removed.

## How it is organised

| File | What it does |
|---|---|
| `App.tsx` | The screen: WebView, back button, offline screen, "preparing file" notice |
| `src/injected.ts` | Script that runs in the page and sends saved files to the app in chunks |
| `src/DownloadReceiver.ts` | Puts the chunks back together and saves the file in the user's folder, or shares it |
| `src/saveFolder.ts` | Asks for and remembers the folder files are saved in |
| `src/downloads.ts` | Checks messages from the page, and makes safe file names |
| `src/navigation.ts` | Decides which links stay in the app |
| `src/config.ts` | The website address |

## Tests

Three kinds, none of which need a phone:

- **Website unit tests** (`npm test` in the project root) cover the logic that decides what
  the app trusts: `src/navigation.ts` and `src/downloads.ts`.
- **Browser tests** (`e2e/mobile-bridge.spec.ts`) run the injected script against the real
  site. They check that results from real tools arrive in the right chunks and come back
  byte for byte.
- **App tests** (`npm test` in this folder) run `App.tsx` and `src/DownloadReceiver.ts` in
  Node with [Jest](https://jestjs.io) and React Native Testing Library. They check the setup
  message, which links stay in the app, the offline screen, the back button, and saving a
  file from the first chunk to the chosen folder, including the first-time question, a folder
  Android took back, falling back to the share sheet, errors, chunks in order, and unsafe file
  names.

`npm run typecheck` here checks the app's own code and tests.

**What the app tests do not prove.** The WebView, the file system and the share sheet are
replaced by fakes (`__tests__/support/`), so they check how the app *uses* those pieces, not
how Android behaves (for example, that the folder picker really keeps its permission). The app tests also don't run in CI, which installs only the website's
packages. Before releasing, install a build on a real phone and check that a tool's result
is saved in the chosen folder and shows up in the Files app, that the back button and links behave, and that the app works with the phone
offline.
