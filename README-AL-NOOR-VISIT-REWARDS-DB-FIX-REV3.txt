AL NOOR LOYALTY — VISIT / REWARDS DB FIX — REV 3

This revision fixes the exact error shown in Supabase:
operator does not exist: text = uuid

Cause:
The live profiles.loyalty_token column is TEXT, while the RPC parameter is UUID.
The previous script compared them directly.

REV 3 compares loyalty_token to p_token::text and also normalizes
get_customer_by_token(uuid) to the current profiles schema.

Run this ENTIRE SQL file once in Supabase SQL Editor.

Do not change config.js.
Do not delete customers.
Do not manually change existing customer points.

Business rule:
- 1 visit = exactly 1 point.
- At 10 visits, one FREE DRINK coupon is created automatically.
- Staff/GM can award visits; customers cannot.
