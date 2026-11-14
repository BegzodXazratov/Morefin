// Admin statistika. Parol: ADMIN_PASSWORD (Vercel env). Sarlavha: x-admin-password.
const L = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.ADMIN_PASSWORD) return res.status(503).json({ error: "ADMIN_PASSWORD Vercel'da sozlanmagan" });
  if (!L.adminOk(req)) return res.status(401).json({ error: "Parol noto'g'ri" });
  const days = Math.min(Math.max(parseInt(req.query.days || '7', 10) || 0, 0), 365);
  const data = await L.rpc('mf_stats', { p_days: days });
  if (!data) return res.status(502).json({ error: "Bazadan o'qib bo'lmadi" });
  return res.status(200).json(data);
};
