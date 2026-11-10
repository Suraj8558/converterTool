import { originOf } from './navigation';

// The address of the deployed website, set when the app is built (see mobile/README.md).
// Android emulators reach the computer's dev server at 10.0.2.2, which is why `npm run dev`
// in the web project works while developing.
const configured = process.env.EXPO_PUBLIC_SITE_URL?.trim();
const siteUrl = configured || (__DEV__ ? 'http://10.0.2.2:9002' : '');

export const SITE_URL = siteUrl;
export const SITE_ORIGIN = originOf(siteUrl);
