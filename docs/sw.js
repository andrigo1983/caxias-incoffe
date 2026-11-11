const cache='caxias-caffe-shell-1',files=['./','./app.css','./app.js','./config.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(cache).then(c=>c.addAll(files))));
self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&files.some(f=>new URL(f,self.registration.scope).href===e.request.url))e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
