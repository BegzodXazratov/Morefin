// Kuzatuv: sahifa kirishi va Telegram tugmasi bosilishi (Meta Pixel + admin statistikasi)
(function(){
  var C = window.MOREFIN_CONFIG || {};
  function cookie(n){ var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; }
  function fbc(){
    var c = cookie('_fbc'); if (c) return c;
    var m = location.search.match(/[?&]fbclid=([^&]+)/);
    return m ? 'fb.1.' + Date.now() + '.' + m[1] : '';
  }
  window.mfTrack = function(kind, ref, extra){
    var body = { kind: kind, site: C.site, ref: ref || '' };
    if (kind === 'bot_click') { body.fbp = cookie('_fbp'); body.fbc = fbc(); }
    if (extra) for (var k in extra) body[k] = extra[k];
    try { fetch(C.trackUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), keepalive: true }); } catch (e) {}
  };
  window.mfPixel = function(kind, name, data){ if (window.fbq) { try { fbq(kind, name, data || {}); } catch (e) {} } };
  window.mfBotLink = function(prefix, id){ return C.botUsername ? 'https://t.me/' + C.botUsername.replace(/^@/, '') + '?start=' + prefix + '_' + id : (C.appUrl || 'https://app.morefin.uz/'); };
  window.mfNewId = function(){ return Math.random().toString(36).slice(2, 8).padEnd(6, '0'); };
  try { if (!sessionStorage.getItem('mf_view')) { sessionStorage.setItem('mf_view', '1'); window.mfTrack('site_view'); } } catch (e) { window.mfTrack('site_view'); }
})();
