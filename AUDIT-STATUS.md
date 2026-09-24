# AL NOOR LOYALTY — FINAL BUILD AUDIT

- Base source: AL-NOOR-LOYALTY-FINAL-AUDIT-V4-ADMIN-SEPARATE.zip.
- Approved logo asset added as `assets/al-noor-approved-logo.png`; checkerboard is not used.
- Customer authentication is Email + Password; OTP/passwordless flows are not included.
- Customer registration: Full Name, Mobile Number, Email, Date of Birth, Password, Confirm Password.
- Customer Profile includes Date of Birth and Change Password.
- Customer portal includes Home, Card, Rewards, Offers, Menu, Locations, Profile.
- Staff portal retains Scan, Customer, Add 1 Visit Point, Redeem, History, Profile.
- Staff History uses Staff Member column.
- GM portal includes Dashboard, Members, Reports, Settings, Menu Management, Offers Management.
- Admin portal remains separate.
- Reward UI is restricted to Free Drink at 10 points.
- Add Points UI is exactly 1 visit point; duplicate prevention remains a server-side responsibility of the existing RPC/database.
- PWA manifest, service worker, and 192/512 icons included.
- Static HTML/CSS/JS/link audit is run after packaging.
- Live GitHub/Supabase behavior is not claimed unless separately tested.
- GM Menu/Offers persistence is intentionally not faked because the audited source contains no verified Menu/Offers database schema or RPC.
