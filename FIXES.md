# AL NOOR Loyalty — Errors Found & Fixes Applied

## 1. Customer authentication
**Problem:** Customer login/register still used email + password in the old build.

**Fix:** Customer portal now uses email-only Magic Link. Password fields were removed from the customer flow.

## 2. Customer / Staff / GM separation
**Problem:** The old build mixed the three portals at the same root level and allowed confusing navigation.

**Fix:** The project is now separated into:
- `customer/`
- `staff/`
- `gm/`

Each portal has its own login and guarded pages.

## 3. Branding mismatch
**Problem:** The old pages recreated the logo with text + a Unicode sun instead of using the approved logo.

**Fix:** The approved AL NOOR BAKERY & CAFE logo from the supplied reference photo is used as the visual asset. The logo artwork itself was not redesigned.

## 4. Broken / inconsistent navigation
**Problem:** Later navigation patches referenced Offers/Menu pages that were not present in the original connected ZIP.

**Fix:** Customer and Staff now have real Menu and Offers pages, and navigation links point to existing files.

## 5. Staff history dependency
**Problem:** The latest Staff History patch expected `get_customer_transactions_with_staff()` and could break if that RPC had not been installed.

**Fix:** The app first tries the staff-aware RPC and automatically falls back to `get_customer_transactions()` so the page does not crash.

## 6. Points vs visits
**Problem:** The old Add Points page allowed arbitrary point amounts, while the agreed operating flow is one visit = one point.

**Fix:** Staff now has a single `+1 VISIT` action.

## 7. Rewards data consistency
**Problem:** The old customer Rewards page read directly from the `rewards` table, while the newer reward history work uses `get_customer_reward_history()`.

**Fix:** Customer Rewards now uses the reward-history RPC and shows Available / Obtained / Total Rewards.

## 8. PWA / Android install foundation
**Problem:** The old manifest was minimal and there was no service worker or proper 192/512 install icons.

**Fix:** Added:
- `manifest.webmanifest`
- `sw.js`
- `icon-192.png`
- `icon-512.png`
- manifest `scope` and `start_url`
- service-worker registration on the root page

## 9. Missing shared configuration
**Problem:** Some newer customer/admin files referenced `assets/config.js`, while the connected ZIP hard-coded the Supabase configuration in `app.js`.

**Fix:** Added one shared `assets/config.js` and made the application use it consistently.

## 10. Broken relative paths from separated pages
**Problem:** Moving pages into Customer/Staff/GM folders can break CSS, JS, manifest and navigation paths.

**Fix:** All generated pages were checked for missing local references. The current build has no missing local HTML/CSS/JS/manifest/image references.

## 11. Design consistency
**Problem:** The old connected ZIP used one generic mobile-card design and did not match the later approved UI direction.

**Fix:** Rebuilt the shared shell around the agreed Al Noor visual language: cream/ivory, deep green, olive and gold, with a desktop sidebar and mobile bottom navigation.

## 12. Scope kept stable
No customer password, Face ID, Passkey, SMS login or forced advertising was added to this build.

## External database prerequisite
The web files cannot create or repair Supabase RPC functions by themselves. The project expects the existing database functions used by the earlier build, including customer profile lookup, QR lookup, visit addition, reward redemption and GM reporting. The Staff History page has a safe fallback when the staff-aware history RPC is unavailable.
