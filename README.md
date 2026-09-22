# Al Noor Loyalty — Final Structure Patch

Target GitHub Pages site:
https://alnoorcafe.github.io/Loyalty-Card/

## Important
This patch intentionally does **not** include `assets/config.js`.
Keep the existing `assets/config.js` in the GitHub repository because it contains the Supabase publishable key.

Do not use the old `mustafamosalam685-ai.github.io` URL.

## Structure
- Customer: `customer/`
- Staff: `admin/staff/`
- GM: `admin/gm/`
- Shared files: `assets/`
- Management login: `admin/admin-login.html`

## Main fixes
- All GitHub Pages paths keep `/Loyalty-Card/`.
- Customer QR opens the customer card URL with the customer token.
- Staff scanner can read that QR URL and extract the token.
- Staff and GM are separated by role.
- Staff profile uses `get_my_profile()` instead of the broken `get_my_staff_profile()` schema-cache path.
- Customer self-registration is disabled; the registration page tells customers to register through Al Noor staff.
- Customer login is email magic-link only and does not create new users.
- PWA manifest uses the correct project-site scope and start URL.
- Service worker is included for Android/PWA installation support.

## Supabase
The existing `assets/config.js` must contain the new project URL and the publishable key for the new Supabase project.
