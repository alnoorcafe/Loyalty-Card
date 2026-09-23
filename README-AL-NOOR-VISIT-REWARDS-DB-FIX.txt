AL NOOR — VISIT / REWARD DATABASE FIX

WHAT THIS FIXES
- Fixes the missing add_customer_point() RPC shown on the Staff Add Visit page.
- Enforces exactly 1 point per visit at the database level.
- Records every visit in point_transactions.
- Automatically creates one FREE DRINK coupon at every 10th point.
- Fixes customer reward history to use the current profiles + loyalty_token structure.
- Adds points_cost compatibility to rewards so Staff Redeem can load correctly.

WHAT IT DOES NOT DO
- Does not delete customers.
- Does not reset points.
- Does not replace assets/config.js.
- Does not change the visual design of the Add Visit page.

HOW TO INSTALL
1. Open Supabase Dashboard.
2. Open SQL Editor.
3. Create a new query.
4. Paste the entire file:
   AL-NOOR-VISIT-REWARDS-DB-FIX.sql
5. Click Run.
6. Wait for the final verification SELECT results.
7. Then refresh the live Al Noor Staff page.
8. Scan Mustafa Mosalam again and press ADD 1 VISIT once.

EXPECTED RESULT
- The red schema-cache error disappears.
- Current Points changes from 0 to 1.
- History records a VISIT +1.
- On the 10th visit, one FREE DRINK appears in Rewards.
