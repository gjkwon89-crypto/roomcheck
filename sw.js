// 현장심사 실별 점검 - 오프라인 캐시
// 앱을 고친 뒤에는 아래 버전 숫자를 하나 올려야 아이패드에 새 버전이 반영됩니다.
var VERSION = 'RCA-v3';
var FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // 화면(HTML): 인터넷 되면 최신, 안 되면(3초) 저장된 것
  if (e.request.mode === 'navigate') {
    e.respondWith(new Promise(function (resolve) {
      var done = false;
      var fallback = function () { if (done) return; done = true; caches.match('./index.html').then(resolve); };
      var t = setTimeout(fallback, 3000);
      fetch(e.request).then(function (res) {
        clearTimeout(t);
        if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put('./index.html', copy); }); }
        if (!done) { done = true; resolve(res); }
      }).catch(function () { clearTimeout(t); fallback(); });
    }));
    return;
  }
  // 나머지: 저장된 것 먼저
  e.respondWith(caches.match(e.request).then(function (hit) { return hit || fetch(e.request); }));
});
