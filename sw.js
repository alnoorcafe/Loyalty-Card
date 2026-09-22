const CACHE = "al-noor-loyalty-v1";
const BASE = "/Loyalty-Card/";
const CORE = [
  BASE,
  BASE+"index.html",
  BASE+"manifest.webmanifest",
  BASE+"assets/style.css",
  BASE+"assets/app.js",
  BASE+"customer/customer-login.html",
  BASE+"customer/customer-home.html",
  BASE+"customer/customer-card.html",
  BASE+"customer/customer-profile.html",
  BASE+"customer/customer-rewards.html",
  BASE+"admin/admin-login.html",
  BASE+"admin/staff/staff-dashboard.html",
  BASE+"admin/staff/staff-scan.html",
  BASE+"admin/staff/staff-customer.html",
  BASE+"admin/staff/staff-add-points.html",
  BASE+"admin/staff/staff-history.html",
  BASE+"admin/staff/staff-profile.html",
  BASE+"admin/staff/staff-redeem.html",
  BASE+"admin/gm/gm-dashboard.html",
  BASE+"admin/gm/gm-members.html",
  BASE+"admin/gm/gm-locations.html",
  BASE+"admin/gm/gm-reports.html",
  BASE+"admin/gm/gm-settings.html"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(BASE+"index.html"))));
});
