AL NOOR CUSTOMER NAV + AUTO SIZE PATCH

Adds:
- Menu + Offers shortcuts on Customer Home.
- Menu in Customer bottom navigation.
- Responsive auto-sizing for phone/tablet/desktop.
- Prevents horizontal overflow and oversized elements.
- iPhone safe-area support.

This patch does NOT change:
- Supabase/config.js
- Customer data
- Staff
- GM
- Rewards database

Install:
1. Copy responsive-autosize.css to assets/
2. Copy customer-navigation.js to assets/
3. On customer pages, after style.css add:
   <link rel="stylesheet" href="../assets/responsive-autosize.css">
4. Before </body> add:
   <script src="../assets/customer-navigation.js"></script>
