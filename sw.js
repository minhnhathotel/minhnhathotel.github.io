// Service worker của app Minh Nhật Luxury Hotel.
// - Trang chính (index.html): lấy bản mới từ mạng trước, mất mạng thì dùng bản đã lưu.
// - Ảnh, font: dùng bản đã lưu cho nhanh, lần đầu thì tải về rồi lưu lại.
// Khi sửa web lớn, tăng số phiên bản dưới đây để xoá bộ nhớ cũ.
const VERSION = 'mn-v1';
const CORE = ['./', './index.html', './manifest.json', './images/logo-icon.png', './images/app/app-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Trang HTML: ưu tiên mạng để luôn thấy giá và nội dung mới nhất
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }

  // Ảnh trong web và font Google: ưu tiên bộ nhớ đã lưu
  const sameSite = url.origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if ((sameSite && /\.(png|jpe?g|webp|svg|json)$/i.test(url.pathname)) || isFont) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
