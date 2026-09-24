AL NOOR CUSTOMER PASSWORD FINAL
================================
Replace these two files in your GitHub project:

customer/customer-register.html
customer/customer-login.html

New flow:
Register -> Email + Password -> Customer Card
Login -> Email + Password -> Customer Card

No OTP is used.

IMPORTANT:
In Supabase Dashboard:
Authentication -> Providers -> Email
Turn OFF "Confirm email" so registration creates a session immediately.
Do not change Staff/GM login.
