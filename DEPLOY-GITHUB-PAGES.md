# AL NOOR Loyalty — GitHub Pages Deployment Checklist

## IMPORTANT
Upload the **contents of this ZIP**, not the ZIP file itself, into the exact GitHub Pages publishing source.

The published folder must contain these at its top level:
- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `assets/`
- `customer/`
- `staff/`
- `gm/`

If `index.html` is inside an extra folder, the root site can show GitHub Pages 404.

## After publishing
1. Open the site root.
2. Confirm the Al Noor welcome screen appears.
3. Open Customer.
4. Open Staff.
5. Open GM / Management.
6. Open Customer Rewards and confirm it no longer produces the old `null is not an object` error.
7. If an older screen still appears, close the old installed PWA and reload the site once. This build uses a new service-worker cache version and cache-busted shared assets.

## Supabase
`assets/config.js` is the single front-end configuration file. Do not change it unless the Supabase project/key has actually changed.

The front-end depends on the existing Supabase Auth, RPC functions and tables described in `FIXES.md`. A valid Supabase publishable key and the required database functions are still necessary for live login, points, rewards, scanning and reports.
