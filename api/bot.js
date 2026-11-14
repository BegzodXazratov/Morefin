// Saytlar uchun: bot username (getMe). Maxfiy narsa qaytarmaydi.
const L = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  const u = await L.botUsername();
  return res.status(u ? 200 : 503).json({ username: u || null });
};
