AL NOOR FINAL DESIGN PATCH
============================

Apply these files to the CURRENT GitHub project:

1. assets/al-noor-official-logo.jpeg
   - Official approved logo file. Do not edit the logo.

2. customer/customer-login.html
   - Email + Password only.
   - NO OTP / verification code.

3. customer/customer-register.html
   - Name + Phone + Email + Password + Confirm Password.
   - NO OTP.

Existing current project rules retained:
- Staff adds exactly 1 point per eligible visit.
- Reward is 10 points / 10 visits = Free Drink.
- Staff History uses Staff Member.
- Staff and GM remain separate.

IMPORTANT:
The final server-side duplicate-visit protection must remain in the Supabase RPC
used by add_customer_point. Do not replace that RPC with client-only point logic.
