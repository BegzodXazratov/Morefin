// Botdagi "Morefin'ga kirish" tugmasi shu yerdan o'tadi: bosilishni sanaydi va platformaga yo'naltiradi.
const L = require('./_lib');
module.exports = async (req, res) => {
  const u = String(req.query.u || ''), s = String(req.query.s || '');
  const target = process.env.APP_URL || 'https://app.morefin.uz/';
  res.setHeader('Cache-Control', 'no-store');
  if (/^\d{1,15}$/.test(u) && s && s === L.sign(u)) {
    await L.userPatch(+u, 'app_click');
    await L.track('app_click', null, +u);
    await L.capi('AppClick', { tgId: u });
  }
  res.statusCode = 302; res.setHeader('Location', target); res.end();
};
