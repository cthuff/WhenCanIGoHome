// Empty Service Worker.
// A Service Worker must be registered for a PWA to trigger the "Add to Home Screen" install banner 
// and satisfy iOS 16.4 requirements for web push notifications, even if it does no background work natively.

self.addEventListener('fetch', function (event) {
    // Empty fetch handler makes the app installable
});
