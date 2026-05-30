const CACHE_NAME = "roadsos-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/icons.svg",
  "/manifest.json"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  // Only handle HTTP/HTTPS requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in the background if possible
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Cache dynamic assets if they are successful
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (event.request.url.includes("/src/") || event.request.url.includes("/@"))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If offline and request is document, serve index.html
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});

// Background Safety Check Timer
let safetyTimer = null;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "START_SAFETY_TIMER") {
    const { intervalMs } = event.data;
    console.log(`[Service Worker] Starting background safety check timer for ${intervalMs}ms`);
    
    if (safetyTimer) {
      clearInterval(safetyTimer);
    }
    
    safetyTimer = setInterval(() => {
      self.registration.showNotification("RoadSOS Safety Check", {
        body: "Are you safe? Tap to open the app and confirm.",
        icon: "/favicon.svg",
        vibrate: [300, 100, 300],
        tag: "roadsos-safety-check",
        requireInteraction: true,
        data: { url: "/" }
      });
    }, intervalMs);
  } else if (event.data && event.data.type === "CANCEL_SAFETY_TIMER") {
    console.log("[Service Worker] Safety check timer cancelled.");
    if (safetyTimer) {
      clearInterval(safetyTimer);
      safetyTimer = null;
    }
  }
});

// Handle notification click to open the PWA
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      // Or open a new window
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
