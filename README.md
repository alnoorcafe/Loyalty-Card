# Al Noor Loyalty

Static GitHub-first build for Al Noor Modern Bakery.

## Important
This version intentionally has **NO Supabase connection yet**.
Finish uploading/testing the complete GitHub file set first. Supabase will be connected afterward.

## Structure
- Customer: `/customer/`
- Staff + GM: `/admin/`
- Shared CSS/JS/config: `/assets/`

## Customer
- Email-only login design
- Magic-link architecture reserved for Supabase
- No password
- No Face ID
- No Passkey
- Full name
- Mobile
- Email
- Optional date of birth
- Birthday contact consent
- Loyalty card / QR placeholder
- Rewards
- Transactions
- Profile

## Staff
- Separate admin portal
- Dashboard
- Customer scanner placeholder
- Customer found
- Add points
- Redeem
- History
- Profile

## GM
- Dashboard
- Members
- Locations
- Reports
- Rewards
- Staff
- Settings
- Upcoming birthdays

## Next phase
1. Upload all files to GitHub.
2. Open GitHub Pages and test navigation/design.
3. Create the new Supabase project.
4. Add database schema, RLS and Auth.
5. Connect `assets/config.js` and `assets/app.js`.
6. Replace demo functions with real database functions.
