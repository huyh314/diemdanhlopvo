// public/sw.js
self.addEventListener('install', (event) => {
    self.skipWaiting();
});
  
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
  
// Empty fetch handler is required for the browser to recognize the PWA and show install prompt
self.addEventListener('fetch', (event) => {
    // Optional: implement a basic network-first or stale-while-revalidate strategy here if needed
});
