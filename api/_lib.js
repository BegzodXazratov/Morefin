const crypto = require('crypto');

async function rpc(fn, args) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY, k = process.env.MF_DB_KEY;
  if (!url || !key || !k) return null;
  try {
    const r = await fetch(url + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ p_key: k }, args))
    });
    if (!r.ok) { console.log('rpc xato', fn, r.status, (await r.text()).slice(0, 200)); return null; }
    const t = await r.text();
    return t ? JSON.parse(t) : true;
  } catch (e) { console.log('rpc istisno', fn, e && e.message); return null; }
}
const track = (kind, site, tgId, ref, meta) => rpc('mf_track', { p_kind: kind, p_site: site || null, p_tg_id: tgId || null, p_ref: ref || null, p_meta: meta || {} });
const userStart = (u, source, lead, score) => rpc('mf_user_start', { p_tg_id: u.id, p_first: u.first_name || null, p_username: u.username || null, p_source: source, p_lead: lead || null, p_score: score === undefined ? null : score });
const userPatch = (tgId, field, value) => rpc('mf_user_patch', { p_tg_id: tgId, p_field: field, p_value: value || null });
const leadMeta = (ref) => (ref ? rpc('mf_lead_meta', { p_ref: ref }) : null);

async function tg(method, body) {
  const r = await fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/' + method, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  return r.json().catch(() => ({}));
}

const sha = (v) => crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');

// Meta Conversions API (server hodisalari). Pixel Telegram ichida ishlamaydi, shuning uchun shu yo'l.
async function capi(eventName, o) {
  const pixel = process.env.META_PIXEL_ID, token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return;
  const meta = o.meta || {};
  const ud = { external_id: [sha(o.tgId)] };
  if (meta.fbp) ud.fbp = meta.fbp;
  if (meta.fbc) ud.fbc = meta.fbc;
  if (meta.ip) ud.client_ip_address = meta.ip;
  if (meta.ua) ud.client_user_agent = meta.ua;
  if (o.phone) ud.ph = [sha(String(o.phone).replace(/\D/g, ''))];
  const body = { data: [{ event_name: eventName, event_time: Math.floor(Date.now() / 1000), event_id: eventName + '_' + o.tgId, action_source: 'chat', user_data: ud }] };
  if (process.env.META_TEST_CODE) body.test_event_code = process.env.META_TEST_CODE;
  try {
    const r = await fetch('https://graph.facebook.com/v21.0/' + pixel + '/events?access_token=' + encodeURIComponent(token), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) console.log('capi xato', eventName, r.status);
  } catch (e) { console.log('capi istisno'); }
}

const publicUrl = () => process.env.PUBLIC_URL || ('https://' + (process.env.VERCEL_PROJECT_PRODUCTION_URL || 'morefin.vercel.app'));
const sign = (tgId) => crypto.createHmac('sha256', process.env.WEBHOOK_SECRET || '').update(String(tgId)).digest('hex').slice(0, 16);
const goLink = (tgId) => publicUrl() + '/api/go?u=' + tgId + '&s=' + sign(tgId);

const ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
  .concat(['https://morefin-baholash.vercel.app', 'https://morefin-taklif.vercel.app']);
function cors(req, res) {
  const o = req.headers.origin;
  if (o && ORIGINS.indexOf(o) !== -1) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
const bodyOf = (req) => { try { return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); } catch (e) { return {}; } };


// Admin parol tekshiruvi (sarlavha x-admin-password)
const h = (v) => crypto.createHash('sha256').update(String(v)).digest();
const adminOk = (req) => { const pw = process.env.ADMIN_PASSWORD; return !!pw && crypto.timingSafeEqual(h(req.headers['x-admin-password'] || ''), h(pw)); };

// Bot username (getMe), xotirada saqlanadi. Saytlar shu orqali botga o'tadi.
let _me = null;
async function botUsername() {
  if (_me) return _me;
  const j = await tg('getMe', {});
  if (j && j.ok && j.result) _me = j.result.username;
  return _me;
}

// Bitta odamga xabar. o = { text, type: text|photo|video|animation|video_note|voice|audio|document, media: file_id yoki https havola, btn }
// btn: { text, url } | { text, go: true } (shaxsiy kuzatiladigan havola) | { text, callback }
// Fayl Telegram serverida turadi, bazada faqat file_id (qisqa matn) saqlanadi.
const MEDIA = { photo: 'sendPhoto', video: 'sendVideo', animation: 'sendAnimation', video_note: 'sendVideoNote', voice: 'sendVoice', audio: 'sendAudio', document: 'sendDocument' };
async function sendTo(tgId, o) {
  const markup = o.btn ? { inline_keyboard: [[o.btn.callback ? { text: o.btn.text, callback_data: o.btn.callback } : { text: o.btn.text, url: o.btn.go ? goLink(tgId) : o.btn.url }]] } : undefined;
  const type = o.media && MEDIA[o.type] ? o.type : 'text';
  let j;
  if (type === 'text') j = await tg('sendMessage', { chat_id: tgId, text: o.text || '...', reply_markup: markup });
  else if (type === 'video_note') {
    // dumaloq videoga matn qo'shib bo'lmaydi: avval video, keyin matn va tugma
    j = await tg('sendVideoNote', { chat_id: tgId, video_note: o.media, reply_markup: o.text ? undefined : markup });
    if (j && j.ok && o.text) j = await tg('sendMessage', { chat_id: tgId, text: o.text, reply_markup: markup });
  } else {
    const body = { chat_id: tgId, caption: o.text ? o.text.slice(0, 1024) : undefined, reply_markup: markup };
    body[type] = o.media;
    if (type === 'video') body.supports_streaming = true;
    j = await tg(MEDIA[type], body);
  }
  if (j && !j.ok) console.log('sendTo xato', tgId, j.error_code, j.description);
  if (j && !j.ok && (j.error_code === 403 || (j.error_code === 400 && /chat not found/i.test(j.description || '')))) await userPatch(tgId, 'blocked');
  return !!(j && j.ok);
}

// Bot sozlamalari: admin paneldan o'zgartiriladi (mf_settings, cfg:*), bo'sh bo'lsa standart qiymat.
const DEFAULTS = {
  greeting: "Assalomu alaykum, {name}! Morefin botiga xush kelibsiz.",
  intro: "Morefin'ga kirishdan oldin mini darslikni ko'rib chiqing. Unda biznes pulini qanday tartibga solish ko'rsatilgan:",
  vsl_file_id: '',
  vsl_caption: "Mini darslik: Morefin bilan biznes pulini qanday nazorat qilish",
  gate_btn: "Saytga o'tish",
  gate_wait: "Oldin videoni ko'ring. Havola taxminan {sec} soniyadan keyin ochiladi.",
  gate_done: "Tayyor! Endi tugma ishlaydi.",
  go_btn: "Morefin'ga kirish",
  watch_seconds: '30',
  no_vsl_text: "Morefin'da 7 kun bepul sinab ko'rishingiz mumkin:",
  reply_text: "Rahmat! Savollaringizga javob Morefin saytida: tugma orqali kirib, 7 kun bepul sinab ko'ring.",
  followups_on: '1',
  followups: "{\"watch\": [{\"day\": 1, \"text\": \"{name}, mini darslikni hali ko'rmadingiz. Atigi bir necha daqiqa: biznes pulini qanday nazorat qilishni ko'rsatamiz.\", \"type\": \"vsl\", \"media\": \"\", \"btn\": \"gate\", \"btnText\": \"\", \"url\": \"\"}, {\"day\": 2, \"text\": \"{name}, ko'p tadbirkor foydani ham, qarzni ham xotirada yuritadi va adashadi. Mini darslikda buni qanday tartibga solish bor.\", \"type\": \"vsl\", \"media\": \"\", \"btn\": \"gate\", \"btnText\": \"\", \"url\": \"\"}, {\"day\": 4, \"text\": \"{name}, darslikni ko'rib chiqing, keyin Morefin'ni 7 kun bepul sinab ko'rasiz.\", \"type\": \"vsl\", \"media\": \"\", \"btn\": \"gate\", \"btnText\": \"\", \"url\": \"\"}, {\"day\": 7, \"text\": \"{name}, bugun 5 daqiqa ajrating: video sizga sotuv, chiqim va qarzni bir joyda ko'rishni ko'rsatadi.\", \"type\": \"vsl\", \"media\": \"\", \"btn\": \"gate\", \"btnText\": \"\", \"url\": \"\"}, {\"day\": 10, \"text\": \"{name}, Morefin'ga hali kirmadingiz. Videoni ko'ring va bepul sinovni boshlang.\", \"type\": \"vsl\", \"media\": \"\", \"btn\": \"gate\", \"btnText\": \"\", \"url\": \"\"}, {\"day\": 14, \"text\": \"{name}, oxirgi eslatma: mini darslik va 7 kunlik bepul sinov sizni kutyapti.\", \"type\": \"vsl\", \"media\": \"\", \"btn\": \"gate\", \"btnText\": \"\", \"url\": \"\"}], \"site\": [{\"day\": 1, \"text\": \"{name}, mini darslikni ko'rdingiz. Endi Morefin'ga kirib, o'z biznesingizni kiriting: 7 kun bepul.\", \"type\": \"text\", \"media\": \"\", \"btn\": \"go\", \"btnText\": \"\", \"url\": \"\"}, {\"day\": 2, \"text\": \"{name}, birinchi sotuv yoki chiqimni yozib ko'ring: bu 2 daqiqa oladi, foyda darrov ko'rinadi.\", \"type\": \"text\", \"media\": \"\", \"btn\": \"go\", \"btnText\": \"\", \"url\": \"\"}, {\"day\": 4, \"text\": \"{name}, Morefin'da qarzlar va jamoa hisobi ham bor. Bepul sinov davomida hammasini ko'rib chiqing.\", \"type\": \"text\", \"media\": \"\", \"btn\": \"go\", \"btnText\": \"\", \"url\": \"\"}, {\"day\": 7, \"text\": \"{name}, hisobni daftardan platformaga o'tkazishga vaqt keldi. 7 kun bepul, karta so'ralmaydi.\", \"type\": \"text\", \"media\": \"\", \"btn\": \"go\", \"btnText\": \"\", \"url\": \"\"}, {\"day\": 10, \"text\": \"{name}, Morefin sizni kutyapti. Kirib, bir marta sinab ko'ring.\", \"type\": \"text\", \"media\": \"\", \"btn\": \"go\", \"btnText\": \"\", \"url\": \"\"}, {\"day\": 14, \"text\": \"{name}, oxirgi eslatma: bepul sinovni boshlash uchun tugmani bosing.\", \"type\": \"text\", \"media\": \"\", \"btn\": \"go\", \"btnText\": \"\", \"url\": \"\"}]}"
};
async function getCfg() {
  const saved = (await rpc('mf_cfg_get', {})) || {};
  const c = Object.assign({}, DEFAULTS, { vsl_file_id: process.env.VSL_FILE_ID || '', watch_seconds: process.env.WATCH_SECONDS || DEFAULTS.watch_seconds });
  Object.keys(saved).forEach((k) => { if (k in DEFAULTS && saved[k] !== '') c[k] = saved[k]; });
  try { c.fu = JSON.parse(c.followups); } catch (e) { c.fu = JSON.parse(DEFAULTS.followups); }
  return c;
}
const fill = (t, name, extra) => String(t || '').replace(/\{name\}/g, name || "do'stim").replace(/\{sec\}/g, extra == null ? '' : extra);

module.exports = { DEFAULTS, getCfg, fill, rpc, track, userStart, userPatch, leadMeta, tg, capi, goLink, sign, cors, bodyOf, adminOk, botUsername, sendTo, publicUrl };
