const CACHE='al-noor-loyalty-v2';
const CORE=[
 './',
 './index.html',
 './manifest.webmanifest',
 './assets/style.css',
 './assets/app.js',
 './assets/config.js',
 './assets/al-noor-official-logo.jpg',
 './assets/icons/icon-192.png',
 './assets/icons/icon-512.png'
];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET') return;
 event.respondWith(
   fetch(event.request).then(res=>{
     const copy=res.clone();
     caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});
     return res;
   }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html')))
 );
});
