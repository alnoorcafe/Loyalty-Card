AL NOOR LOYALTY — VISIT REWARDS FIX

The previous patch had two frontend/backend mismatches. This patch fixes them.

1) Staff Add Visit calls the existing add_customer_point RPC with:
   p_customer_id
   p_points = 1
   p_location_id
   p_note = Visit

2) Customer Rewards uses the correct rewardHistory element.

3) Staff Redeem uses the existing redeem_customer_coupon RPC signature and a 10-point Free Drink reward.

IMPORTANT:
- Do NOT replace assets/config.js.
- Upload the files preserving their folders.
- Run AL-NOOR-10-VISIT-REWARD-SETUP.sql once in Supabase SQL Editor.
- Then hard-refresh the GitHub Pages site.
