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

module.exports = { rpc, track, userStart, userPatch, leadMeta, tg, capi, goLink, sign, cors, bodyOf };
