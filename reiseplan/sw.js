// Reiseplan Offline-Cache. Bei Änderungen an der App VERSION erhöhen.
var VERSION='reiseplan-v1';
var CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){return c.addAll(CORE);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k.indexOf('reiseplan-')===0&&k!==VERSION;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  var same=url.origin===self.location.origin;
  var font=url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com';
  if(!same&&!font)return; // Live-Daten (Wetter, Kurse, Flüge) immer direkt, die App hat eigene Zwischenspeicher
  if(font){
    e.respondWith(caches.match(req).then(function(hit){
      return hit||fetch(req).then(function(r){var cp=r.clone();caches.open(VERSION).then(function(c){c.put(req,cp);});return r;});
    }));
    return;
  }
  // Eigene Dateien: erst Netz (frisch), bei Fehler Cache
  e.respondWith(fetch(req).then(function(r){
    if(r&&r.ok){var cp=r.clone();caches.open(VERSION).then(function(c){c.put(req,cp);});}
    return r;
  }).catch(function(){
    return caches.match(req,{ignoreSearch:true}).then(function(hit){
      return hit||(req.mode==='navigate'?caches.match('index.html'):undefined);
    });
  }));
});
