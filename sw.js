// Bộ nhớ đệm để chơi offline. Mỗi lần cập nhật game, tăng số phiên bản.
const CACHE = 'tech-english-v7';
const FILES = [
  './', './index.html', './css/style.css', './manifest.json',
  './js/util.js', './js/icons.js', './js/world.js', './js/input.js', './js/game.js', './js/ui.js', './js/main.js',
  './js/data/words.js', './js/data/components.js', './js/data/quests.js', './js/data/regions.js',
  './js/data/farm.js', './js/data/convos.js', './js/data/hvac_questions.js', './js/data/hvac_listening.js', './js/hvac.js', './js/data/teashops.js', './js/work.js', './js/tea.js', './js/online.js', './js/vendor/mqtt.min.js', './js/data/mall.js', './js/mall.js',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Ưu tiên mạng (luôn lấy bản mới), mất mạng thì dùng bản đã lưu
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => {
    const copy = r.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request)));
});
