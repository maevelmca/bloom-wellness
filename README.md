# BLOOM — first website draft

## What is in this draft
- Responsive BLOOM website with a solid-color blush / cream / sage visual style. **No gradients or ombré.**
- Bottom navigation and a home dashboard with live date/time and rotating affirmations.
- Food journal with calorie, protein, carbohydrate and fat fields.
- A personal saved-food library, plus best-effort Open Food Facts product search.
- Exercise / movement journal, including soccer and optional duration/feeling/notes.
- Custom habit list with checkboxes.
- Planner entries for school, soccer, appointments and personal tasks.
- Mood check-in and personal journal entries.
- Light/dark theme.
- Local IndexedDB saving, JSON export/import, delete-all control.
- PWA manifest, 192px/512px app icons and service worker for installation/offline shell when hosted over HTTPS.

## Honest scope note
This is a **working first draft of the core sections**, not the complete BLOOM feature list. It does not yet include photo uploads, recipe nutrition calculator, barcode scanning, meal planning calendar, routine builder/timers, push notifications, automatic weather, sleep tracker, skincare/product collection, full calendar views, edit-in-place for saved entries, secure app lock, or clinician-formatted reports. Those should be added in later tested stages. Do not assume a feature is present unless it appears in the app.

## Food database note
The external lookup uses Open Food Facts' legacy full-text search endpoint. Coverage and nutrition fields vary by product, and the provider documents that full-text search is currently available through its legacy CGI endpoint while API v3 is the recommended current API family. Treat returned values as reference data, not guaranteed label values. Search values shown by this draft are per 100 g; check serving size and package label before recording. See https://openfoodfacts.github.io/openfoodfacts-server/api/ and https://openfoodfacts.github.io/documentation/docs/Product-Opener/v2/search/get-search/ .

## Run locally for a preview
1. Unzip the folder.
2. Open a terminal in the folder.
3. Run `python3 -m http.server 8000`.
4. Open `http://localhost:8000` in a browser.

A local server is needed for service-worker/PWA testing. Opening `index.html` directly may show the page, but install/offline features will not activate reliably.

## Publish it as a website
You need to upload these files to an HTTPS static host. I have not published it or created a public website address for you.

One possible route is GitHub Pages:
1. With help from a trusted adult if needed, create a GitHub account and a new repository.
2. Upload the contents of this folder (`index.html`, `manifest.webmanifest`, `sw.js`, `icon.svg`, `icon-192.png`, and `icon-512.png`) to the repository root.
3. In repository Settings → Pages, select deployment from the main branch and root folder.
4. Wait for GitHub Pages to show the published HTTPS address.
5. Open that address on your phone.
6. iPhone: open in Safari → Share → Add to Home Screen. Android: open in Chrome → menu → Install app / Add to Home screen (wording varies).

PWA installation requires an appropriate web app manifest and a secure HTTPS origin (localhost is allowed for local development). See https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable .

## Local-only privacy and backups
- Entries are stored in IndexedDB in the browser profile on this device. There is no account or cloud database and no cross-device sync.
- If you open the website in a different browser or clear that browser's site data, the entries may not be there.
- Export a JSON backup regularly and keep it somewhere private. The backup can contain personal journal and nutrition information.
- Open Food Facts receives the words you search for when you use external food search. Your saved entries stay in this browser.
- The website source files may be publicly visible on a static host, but your locally saved entries are not uploaded by this draft.
