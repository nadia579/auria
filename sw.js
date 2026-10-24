// Nome della cache. Quando cambi i file dell'app, aumenta il numero (v2, v3...)
// così il telefono scarica la versione nuova invece di tenersi la vecchia.
const CACHE = 'auria-v4';
// I file necessari per aprire l'app anche offline

const FILES = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './style.css'
];

// INSTALL: scatta la prima volta che il browser vede questo service worker.
// Apriamo la cache e ci mettiamo dentro tutti i file.
// waitUntil = "non considerare finita l'installazione finché questa Promise non completa"
// (come aspettare che un Mono termini).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // cache: 'reload' = ignore the browser's HTTP cache and always download fresh files
      cache.addAll(FILES.map((file) => new Request(file, { cache: 'reload' })))
    )
  );
  self.skipWaiting();
});

// ACTIVATE: scatta quando questa versione prende il controllo.
// Cancelliamo le cache delle versioni vecchie (auria-v1 quando arriva auria-v2, ecc.)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // prende subito il controllo delle pagine già aperte
});

// FETCH: scatta per ogni file che la pagina chiede.
// Strategia "cache first": se il file è in cache lo diamo da lì (veloce, funziona offline),
// altrimenti lo chiediamo alla rete.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});