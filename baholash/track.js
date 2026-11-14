// Kuzatuv: sahifa kirishi va Telegram tugmasi bosilishi (Meta Pixel + admin statistikasi)
(function(){
  var C = window.MOREFIN_CONFIG || {};
  function cookie(n){ var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; }
  function fbc(){
    var c = cookie('_fbc'); if (c) return c;
    var m = location.search.match(/[?&]fbclid=([^&]+)/);
    return m ? 'fb.1.' + Date.now() + '.' + m[1] : '';
  }
  // UTM (Meta reklama URL parametrlari) sessiya davomida saqlanadi
  var UTM = {};
  try { UTM = JSON.parse(sessionStorage.getItem('mf_utm') || '{}'); } catch (e) {}
  (location.search.replace(/^\?/, '').split('&')).forEach(function(p){ var kv = p.split('='); if (/^utm_(source|medium|campaign|content|term)$/.test(kv[0]) && kv[1]) UTM[kv[0]] = decodeURIComponent(kv[1].replace(/\+/g, ' ')); if (kv[0] === 'fbclid') UTM.fbclid = 1; });
  try { sessionStorage.setItem('mf_utm', JSON.stringify(UTM)); } catch (e) {}
  window.mfTrack = function(kind, ref, extra){
    var body = { kind: kind, site: C.site, ref: ref || '' };
    for (var u in UTM) body[u] = UTM[u];
    if (kind === 'bot_click') { body.fbp = cookie('_fbp'); body.fbc = fbc(); }
    if (extra) for (var k in extra) body[k] = extra[k];
    try { fetch(C.trackUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), keepalive: true }); } catch (e) {}
  };
  window.mfPixel = function(kind, name, data){ if (window.fbq) { try { fbq(kind, name, data || {}); } catch (e) {} } };
  // Bot username serverdan olinadi (/api/bot), config.js dagi botUsername bo'lsa o'sha ustun.
  var botName = (C.botUsername || '').replace(/^@/, ''), botReady = null;
  function loadBot(){
    if (botName) return Promise.resolve(botName);
    if (!botReady) botReady = fetch((C.trackUrl || '/api/track').replace(/\/api\/track.*$/, '') + '/api/bot').then(function(r){ return r.json(); }).then(function(j){ botName = (j && j.username) || ''; return botName; }).catch(function(){ return ''; });
    return botReady;
  }
  // Tugmani botga bog'laydi: havola tayyor bo'lgach href qo'yiladi; tayyor bo'lmasdan bosilsa kutib, keyin o'tadi.
  window.mfBindBot = function(el, prefix, id, onClick){
    function link(){ return 'https://t.me/' + botName + '?start=' + prefix + '_' + id; }
    loadBot().then(function(n){ if (n) el.href = link(); });
    el.addEventListener('click', function(e){
      if (onClick) { try { onClick(); } catch (x) {} }
      if (botName) return;
      e.preventDefault();
      loadBot().then(function(n){ if (n) location.href = link(); else el.textContent = "Bot hozircha ulanmagan, keyinroq urinib ko'ring"; });
    });
  };
  window.mfNewId = function(){ return Math.random().toString(36).slice(2, 8).padEnd(6, '0'); };
  try { if (!sessionStorage.getItem('mf_view')) { sessionStorage.setItem('mf_view', '1'); window.mfTrack('site_view'); } } catch (e) { window.mfTrack('site_view'); }
})();
