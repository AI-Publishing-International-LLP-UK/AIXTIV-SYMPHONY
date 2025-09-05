
// Service Worker for ASOOS Mobile - Offline Support
const CACHE_NAME = 'asoos-mobile-v1';
const urlsToCache = [
  '/',
  '/config',
  '/health',
  '/css/app.css',
  '/js/app.js',
  '/icons/asoos-192.png',
  '/icons/asoos-512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching ASOOS Mobile resources');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Background sync for queued commands
self.addEventListener('sync', (event) => {
  if (event.tag === 'command-sync') {
    event.waitUntil(processCommandQueue());
  }
});

async function processCommandQueue() {
  // This would integrate with the offline sync service
  console.log('🔄 Background sync: Processing command queue');
}
