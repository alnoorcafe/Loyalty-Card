AL NOOR LOYALTY — VISIT / REWARD DATABASE FIX (REVISION 2)

Why this revision exists:
The previous SQL patch could fail on databases where public.rewards.points_required is NOT NULL.
This revision explicitly supports points_required and supplies value 10 when creating Free Drink.

RUN THIS FILE:
AL-NOOR-VISIT-REWARDS-DB-FIX.sql

Run it once in Supabase SQL Editor. It is designed to be safe to re-run.

It does NOT:
- delete customers
- reset existing points
- change assets/config.js
- change the Add Visit page design

It DOES:
- install/replace add_customer_point(customer_id, points, location_id, note)
- enforce exactly 1 point per successful visit
- record each visit
- ensure Free Drink exists with points_required = 10 and points_cost = 10
- create a Free Drink coupon at every 10th point
- repair customer reward history for profiles/loyalty_token
- repair customer transaction history

IMPORTANT:
Do not run the older Visit Rewards SQL after this revision.
After Run succeeds, send a screenshot of the SQL result before testing ADD 1 VISIT.
