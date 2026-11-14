// Admin: bot profili. GET -> { name, description, short_description, username }
// POST { name?, description?, short_description?, photo? (data:image/jpeg;base64,...) }
const L = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!L.adminOk(req)) return res.status(401).json({ error: "Parol noto'g'ri" });
  if (req.method === 'POST') {
    const b = L.bodyOf(req), out = {};
    if (typeof b.name === 'string') { const j = await L.tg('setMyName', { name: b.name.slice(0, 64) }); out.name = j.ok || j.description; }
    if (typeof b.description === 'string') { const j = await L.tg('setMyDescription', { description: b.description.slice(0, 512) }); out.description = j.ok || j.description; }
    if (typeof b.short_description === 'string') { const j = await L.tg('setMyShortDescription', { short_description: b.short_description.slice(0, 120) }); out.short_description = j.ok || j.description; }
    if (typeof b.photo === 'string' && /^data:image\/(jpeg|png);base64,/.test(b.photo)) {
      try {
        const buf = Buffer.from(b.photo.split(',')[1], 'base64');
        const fd = new FormData();
        fd.append('photo', JSON.stringify({ type: 'static', photo: 'attach://p' }));
        fd.append('p', new Blob([buf], { type: 'image/jpeg' }), 'photo.jpg');
        const r = await fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/setMyProfilePhoto', { method: 'POST', body: fd });
        const j = await r.json().catch(() => ({}));
        out.photo = j.ok ? true : (r.status === 404 ? "Telegram API bot rasmini o'zgartirishga ruxsat bermadi: BotFather → /setuserpic orqali o'zgartiring" : j.description || 'Xato');
      } catch (e) { out.photo = 'Xato: ' + (e && e.message); }
    }
    return res.status(200).json({ ok: true, result: out });
  }
  const [n, d, s, me] = await Promise.all([L.tg('getMyName', {}), L.tg('getMyDescription', {}), L.tg('getMyShortDescription', {}), L.tg('getMe', {})]);
  return res.status(200).json({
    name: (n.result || {}).name || '', description: (d.result || {}).description || '',
    short_description: (s.result || {}).short_description || '', username: (me.result || {}).username || ''
  });
};
