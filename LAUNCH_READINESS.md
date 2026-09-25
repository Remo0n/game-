# Bento Blocks — launch readiness

**Status: ready for release-candidate testing; not yet ready for public publication.**
Target: web, iOS, and Android together. Audited September 25, 2026.
No hosting deployment, paid build, store submission, or account setup was performed.

The latest [application review](./FINAL_REVIEW.md) includes 63 passing tests,
small-screen and tool-dialog fixes, preserved replay access after level 90, and
a fresh clean dependency audit. See [MONETIZATION.md](./MONETIZATION.md) for the
proposed revenue model; no billing, ads, or analytics are enabled.

## Completed in the project

| Area | What now works |
| --- | --- |
| Visual identity | Locally bundled Outfit in four real weights; stronger secondary-text contrast; food-themed launcher, adaptive, monochrome, favicon, and home-screen icons. Existing illustrated skins, animations, cutting feedback, and splash retained. |
| Saves and progression | Startup waits for saved progress; versioned migration validates fields; writes are serialized. Completion saves results, reward, stars, daily streak, and progression together. Result time/cuts survive reloads. |
| Game reliability | Daily results are keyed by date; repeated clears do not duplicate rewards. Campaign replays no longer change with recent-history contents. Failed wallet-funded tools roll back. Backgrounding and open dialogs pause the timer. Malformed and locked routes are guarded. |
| Feedback and recovery | Original bundled cut/snap/error/success sounds; optional haptics fail safely. Share errors display feedback. Crash recovery and missing-page screens added. Settings includes support, privacy, licenses, and confirmed progress deletion. Production hides the debug route. |
| Release infrastructure | EAS preview/simulator/production profiles; environment-driven app identity; release preflight; production web preview; SPA hosting rules; CI checks and all-platform exports; patched dependencies. Microphone, background-audio, storage, and overlay permissions removed from native config. |

## Verification performed

| Check | Result |
| --- | --- |
| TypeScript + regression checks | 63 tests passed. Includes daily idempotency, legacy-save migration, result persistence, malformed links, deterministic replay, tool confirmation while paused, inventory rollback, world chapter navigation, small-screen board geometry, background pause, and decoder compatibility. |
| Puzzle scale check | 10,000/10,000 passed validation of cut replay, connected pieces, full target coverage, and variation rules. Average generation 6.82 ms on this machine. This validates constructed solutions; it is not a 10,000-puzzle independent exhaustive solver run. |
| Revised campaign progression | A separate 10,000-puzzle curriculum audit passed: zero invalid puzzles, all scores within six points of their targets, and all 1,975 challenge/recovery pairs became easier. Average generation 48 ms, maximum 1.35 seconds in Node. Physical-device latency still needs measurement. [Details](./DIFFICULTY_PROGRESSION.md) |
| Clean dependency install | `npm ci` passed in a separate temporary directory. Import-adapter regression tests passed there too. |
| Dependency audit | Zero reported vulnerabilities after UUID and decoder overrides. Re-run before release; an audit is not a complete security assessment. |
| Optimized bundles | Web JavaScript plus iOS/Android Hermes bundles exported. These are **not signed native binaries** and do not establish real-device compatibility. |
| Native configuration | Introspection shows no microphone usage string or background audio mode; unwanted Android permissions marked for removal; arbitrary iOS HTTP loads disabled. Check the final signed binaries too. |
| Production web interaction | At 1280×720 and 390×844: outside-piece cutting, undo/recut, tray placement, completion, preserved result after refresh, saved stars/unlock, invalid-link recovery, debug redirect, and reset cancellation. No console errors observed. |

## Five remaining release gates

1. **Choose the public identity.** Developer/company name, support inbox, website domain, permanent bundle/package ID, and Expo project are undecided. Copy `.env.example` to `.env.local` and fill your own values. Confirm the final game name and rights to release its identity and content. Do not use a placeholder bundle ID for store registration.
2. **Publish and finalize the public pages.** Select a host and HTTPS domain. The current `/privacy` text is a preview draft: confirm the actual hosting provider, log retention, contact identity, and any data collection before publication. Publish reachable `/privacy` and `/support` URLs; set the same public environment values in hosting and EAS. Confirm SPA deep links and asset caching on the chosen host. Apple expects working support and privacy links. [Apple review guidance](https://developer.apple.com/app-store/review/)
3. **Connect store accounts and signing.** Link your own Expo project, Apple Developer/App Store Connect account, and Google Play Console account. Register the permanent app IDs and configure signing. Build actual iOS and Android release candidates with EAS; fill submission credentials in your account when ready. [EAS Build](https://docs.expo.dev/build/introduction/)
4. **Run a real-device release test.** Use TestFlight and Play internal/closed testing. Test cutting/drag accuracy on a small iPhone, an iPad, and a midrange Android phone; system font scaling; VoiceOver/TalkBack; reduced motion; mute/sound/haptics; background/resume; Android Back; interrupted launches; persisted saves; share sheets; offline native launch; and OS permission prompts. Gameplay still relies on gestures—do not claim full screen-reader or keyboard-only accessibility. Web still needs Safari/iOS and Android Chrome checks; this pass used the desktop in-app browser at phone dimensions.
5. **Finish the listings and coordinate release.** Capture screenshots from signed builds for required devices, write store copy, set age/content ratings, complete App Privacy and Data Safety declarations against the shipped build and host, and choose countries/pricing. Newly created personal Play accounts may need 12 opted-in testers for 14 continuous days before applying for production access. Wait for both stores’ approval and use manual release if launching all three together. [Apple privacy details](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy) · [Google testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB)

## Commands

Local production preview:

```sh
npm ci
npm run check
npm run build:web
npm run preview:web
```

Open http://localhost:8082. This preview has separate local storage from port 8081.
The verified combined export from this audit is at `/private/tmp/bento-release-final`.

Release preflight (currently expected to fail because identity is undecided):

```sh
npm run release:check
npm run release:check -- --web
```

After setting public environment values in EAS and linking the correct project:

```sh
npx eas-cli build --profile preview --platform all
npx eas-cli build --profile production --platform all
```

These commands create remote builds; check account/build terms before executing.
They were not run during this audit. Native build hooks run tests and the release
identity preflight. Set values in the appropriate EAS `preview`/`production`
environment; `.env.local` alone is not the remote build configuration.

## Deployment behavior

The Expo web output is a single-page app. Publish `dist` and route application
paths to `index.html`, while serving actual assets directly. `public/_redirects`
and `_headers` support hosts such as Netlify; `vercel.json` is also provided.
No hosting provider or domain has been selected. [Expo web publishing](https://docs.expo.dev/guides/publishing-websites/)

The home-screen manifest is included. There is **no offline web service worker**;
a fresh browser launch requires network access. Native assets are bundled.
Progress lives on each device/browser with no cloud sync. Completed results are
saved; an unfinished attempt resets when the page is reloaded or the game exits.

## Dependency maintenance

`xcode` uses `uuid@11.1.1` for a compatible patched `v4` API. Expo Router 57 still
uses CommonJS `query-string@7`, so `decode-uri-component@0.5.0` needs the guarded
one-line import adapter in `scripts/patch-query-string.cjs` applied by `postinstall`.
The decoder's upstream release replaces recursive decoding with a single-pass
scanner. Unicode, repeated query parameters, and long malformed encodings are
covered by regression checks. Keep install scripts enabled and remove/review the
adapter when Expo Router updates. [Decoder release](https://github.com/SamVerschueren/decode-uri-component/releases/tag/v0.5.0)

CI checks type safety, tests, all-platform bundle export, and moderate-or-higher
advisories. It does not deploy, sign, submit, or run physical-device tests.
