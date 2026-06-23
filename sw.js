// network-only 서비스워커: 캐시를 전혀 하지 않음 (항상 최신 코드).
// 구버전이 캐시되어 사용자가 옛 화면을 보는 문제를 원천 차단.
const CACHE_NAME = "nbbang-v3-nocache";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k)))) // 기존 캐시 전부 삭제
      .then(() => self.clients.claim())
  );
});

// fetch 핸들러에서 respondWith를 호출하지 않음 → 브라우저 기본 네트워크 요청 사용 (캐시 없음)
