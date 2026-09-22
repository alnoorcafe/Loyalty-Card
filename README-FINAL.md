# AL NOOR LOYALTY — Final Pilot Build

## Final flow
- Public Customer QR → `customer/customer-register.html`
- Customer registers name, mobile, email, DOB and optional birthday-contact consent.
- Customer receives a magic-link email → `customer/customer-login.html` → Customer Home/Card.
- Customer Card displays a personal QR token for Staff scanning.
- Staff / GM QR → `admin/admin-login.html` → role-based routing.

## One required configuration before GitHub Pages deployment
Open `assets/config.js` and replace `PASTE_NEW_SUPABASE_PUBLISHABLE_KEY_HERE` with the NEW Supabase publishable key for project `hlzmbmngsbvnlaaoau.supabase.co`. Do not use a `sb_secret_` key.

## Supabase customer registration
Run `AL-NOOR-FIX-CUSTOMER-REGISTRATION.sql` in the new project's SQL Editor. In Authentication settings, new-user signups must be allowed for the customer self-registration flow. Configure the site's URL/redirect URL to the GitHub Pages project URL.

## Important
The browser cannot safely contain a secret Supabase key. Only the publishable key belongs in `assets/config.js`.
