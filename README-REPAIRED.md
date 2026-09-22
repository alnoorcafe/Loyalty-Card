# AL NOOR LOYALTY — REPAIRED BUILD

This build keeps the final folder structure and fixes the concrete issues found during code review:

1. `assets/app.js` no longer depends exclusively on `get_my_profile`; it falls back to the signed-in user's `profiles` row.
2. Added a final SQL setup that creates both `get_my_profile()` and the backward-compatible `get_my_staff_profile()`.
3. Updated PWA manifest with 192px and 512px icons.
4. Updated service worker cache from v1 to v3 and removes older Al Noor caches.
5. Added `diagnostic.html` to expose the exact Supabase error instead of a generic load failure.

## Upload
Upload the contents of this folder to the root of the GitHub `main` branch. Keep your real publishable key in `assets/config.js`; do not paste the key into chat.

## Supabase
Run `AL-NOOR-FINAL-SETUP.sql` once in Supabase SQL Editor.

## Auth Redirect
In Supabase Authentication → URL Configuration, Site URL should be:
`https://alnoorcafe.github.io/Loyalty-Card/`

Add this Redirect URL:
`https://alnoorcafe.github.io/Loyalty-Card/customer/customer-login.html`

## Diagnostic
After GitHub Pages finishes deploying, open:
`https://alnoorcafe.github.io/Loyalty-Card/diagnostic.html`

Do not send the publishable key itself. A screenshot of the diagnostic results is enough.
