// Saytlardan keladigan kuzatuv hodisalari (kirish, test, botga o'tish tugmasi).
const L = require('./_lib');
const KINDS = ['site_view', 'quiz_start', 'quiz_done', 'bot_click'];
const SITES = ['baholash', 'taklif'];
module.exports = async (req, res) => {
  L.cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();
  const b = L.bodyOf(req);
  if (KINDS.indexOf(b.kind) === -1 || SITES.indexOf(b.site) === -1) return res.status(400).json({ ok: false });
  const ref = /^[a-z0-9]{4,12}$/.test(String(b.ref || '')) ? String(b.ref) : null;
  const meta = {};
  if (b.kind === 'bot_click') {
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (fwd) meta.ip = fwd.slice(0, 64);
    if (req.headers['user-agent']) meta.ua = String(req.headers['user-agent']).slice(0, 300);
    if (b.fbp) meta.fbp = String(b.fbp).slice(0, 100);
    if (b.fbc) meta.fbc = String(b.fbc).slice(0, 200);
    if (b.score !== undefined) meta.score = +b.score || 0;
  }
  await L.track(b.kind, b.site, null, ref, meta);
  return res.status(204).end();
};
