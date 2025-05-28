const CACHE_NAME = 'fit-calendar-v1';
const ASSETS_TO_CACHE = [
    '/',
    'index.html',
    'manifest.json',
    'assets/style.css',
    'themes/light.css',
    'themes/dark.css',
    'themes/neutral.css',
    'themes/contrast.css',
    'scripts/app.js',
    'scripts/db.js',
    'scripts/clients.js',
    'scripts/schedule.js',
    'scripts/finance.js',
    'components/ThemeSwitcher.js',
    'components/financeView.js',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Установка Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Перехват запросов
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем кэшированный ответ, если он есть
                if (response) {
                    return response;
                }

                // Иначе делаем сетевой запрос
                return fetch(event.request)
                    .then(response => {
                        // Проверяем валидность ответа
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Клонируем ответ, так как он может быть использован только один раз
                        const responseToCache = response.clone();

                        // Кэшируем новый ответ, исключая URL с параметрами страницы
                        if (!event.request.url.includes('/?page=')) {
                             caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return response;
                    })
                    .catch(() => {
                        // Если запрос не удался и это HTML-страница, возвращаем офлайн-страницу
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
}); 