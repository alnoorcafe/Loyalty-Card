# AL NOOR LOYALTY — STATIC AUDIT STATUS

- Official supplied logo is included unchanged at `assets/al-noor-official-logo.jpeg`.
- Current active Staff entry is `staff-scan.html` (QR scan + manual token).
- Current Staff pages: scan, customer, add-one-point, redeem, history, profile.
- Current GM pages: dashboard, members, locations, reports, settings.
- Customer pages: login, register, home, card, rewards, profile.
- Public Menu, Offers and four-branch Locations pages are present.
- Staff History column is `Staff Member`, not `Note`.
- Add Points UI is fixed to exactly `+1` per visit; no manual quantity field.
- Reward UI is restricted to the 10-visit Free Drink reward.
- Legacy `staff-portal.html` redirects to the current Staff Scan portal.
- Legacy `staff/`, `gm/`, and `customer/` entry points redirect to the current portals.
- Admin config file is present and admin redirects point to existing current routes.
- JavaScript syntax and local asset/link checks are performed during packaging.
- Live GitHub/Supabase behavior is not claimed unless separately tested against the live services.
