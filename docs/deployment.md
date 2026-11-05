# Deployment

The site is set up for [Firebase App Hosting](https://firebase.google.com/docs/app-hosting), configured in [`apphosting.yaml`](../apphosting.yaml).

## Environment variables

Both are built into the site, so they must be available when it builds. Changing one needs a new build.

| Variable | Used for | If missing |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Sitemap, canonical links and sharing tags, such as `https://example.com` | They all point to `localhost`, which harms search results |
| `NEXT_PUBLIC_CONTACT_EMAIL` | The address the contact form emails | The contact form is disabled |

To set them in `apphosting.yaml`:

```yaml
env:
  - variable: NEXT_PUBLIC_SITE_URL
    value: https://example.com
    availability:
      - BUILD
  - variable: NEXT_PUBLIC_CONTACT_EMAIL
    value: hello@example.com
    availability:
      - BUILD
```

The contact email is visible to anyone reading the site's code, so a dedicated address is safer than a personal one.

## Build

`npm run build` runs `scripts/copy-ffmpeg.mjs` first, which copies the video engine to `public/ffmpeg/`.

If a host runs `next build` directly, that step is skipped and **the video tools will fail to load**. Check them after the first deploy.

## Launch checklist

- [ ] Set both environment variables
- [ ] Run the [browser tests](testing.md) and confirm CI passes, including Firefox
- [ ] Open a video tool on the deployed site, and confirm it converts a file
- [ ] Try real files, especially iPhone photos and real Word documents
- [ ] Try the site in real Safari
- [ ] Have the [privacy](../src/app/privacy/page.tsx) and [terms](../src/app/terms/page.tsx) pages reviewed, and name the service's legal owner in the terms
- [ ] Compare the privacy page with what your Google Tag Manager container really collects, and decide whether you need a consent banner
- [ ] Resolve the licence question below

## Licensing

The project has no `LICENSE` file, although the README calls it open source.

`@ffmpeg/core`, which powers the video tools, is licensed GPL-2.0-or-later. The site serves that engine to visitors, while the terms call the site's features its exclusive property. Get advice before launch. Removing GIF to MP4 and MP4 to AVI would avoid the question.

## Analytics

The Google Tag Manager ID is set directly in [`layout.tsx`](../src/app/layout.tsx).
