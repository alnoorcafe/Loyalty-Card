# AL NOOR LOYALTY — FINAL DESIGN STRUCTURE

This version uses the agreed separation:

- `index.html` = Welcome / entry only
- `customer/` = Customer experience only
- `admin/admin-login.html` = Staff & Management gateway
- `admin/staff/` = Staff portal only
- `admin/gm/` = GM portal only
- `assets/` = shared CSS/JS/config

## Important
Keep the existing working `assets/config.js` from your current project if it already contains your Supabase publishable key. The included file contains the new project URL but intentionally does not contain a secret/publishable key.

All local HTML links were checked after the folder move.
