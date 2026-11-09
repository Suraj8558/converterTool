# Converter Tool for Android

An [Expo](https://expo.dev) app that shows the deployed Converter Tool website in a
WebView. Every tool works as it does in the browser, and files are still processed on the
phone and never uploaded.

The app adds what a WebView does not do on its own:

- **Saving files.** Android's WebView can't save the `blob:` links the tools make for their
  results. The app catches them, passes the file to the app in small chunks and opens
  Android's share sheet, where you can save it to Files or Drive, or send it to another app.
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
| `src/DownloadReceiver.ts` | Puts the chunks back together, saves the file and opens the share sheet |
| `src/downloads.ts` | Checks messages from the page, and makes safe file names |
| `src/navigation.ts` | Decides which links stay in the app |
| `src/config.ts` | The website address |

## Tests

The logic that decides what the app trusts (`src/navigation.ts`, `src/downloads.ts`) is
tested with the website's unit tests: run `npm test` in the project root. The injected
script is tested against the real site in `e2e/mobile-bridge.spec.ts`: it checks that
results from real tools arrive in the right chunks and come back byte for byte.

`npm run typecheck` here checks the app's own code.

Not covered by tests: the Android side of `DownloadReceiver.ts` (writing the file and
opening the share sheet), and the WebView itself. Check those on a real phone before releasing.
