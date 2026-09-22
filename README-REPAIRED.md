[README-REWARDS-UPDATE.md](https://github.com/user-attachments/files/32540405/README-REWARDS-UPDATE.md)
# AL NOOR LOYALTY — Visit Rewards Update

This patch keeps the existing Al Noor design and changes only the loyalty behavior requested:

- Every successful customer visit adds exactly **1 point**.
- Staff no longer chooses 25/50/100/250 points.
- At every 10th visit, the existing `add_customer_point(p_customer_code)` backend flow unlocks a reward.
- Customer Rewards page now shows 3 cards: **Available / Obtained / Total Rewards**.
- Customer reward history reads from the existing `get_customer_coupons(p_token)` RPC.
- Staff Redeem now redeems an available coupon using the existing `redeem_customer_coupon(p_customer_code, p_coupon_code)` RPC.

## Important
This patch intentionally uses the existing RPC signatures that match the earlier working Al Noor loyalty backend. It does not change Supabase schema or expose any keys.

Before replacing the live files, keep your current `assets/config.js` publishable key. Do not send the key in chat.
