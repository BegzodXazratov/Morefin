// Admin: bot sozlamalari. GET -> { cfg, defaults }, POST { values: {k: v} } (bo'sh qiymat = standartga qaytish)
const L = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!L.adminOk(req)) return res.status(401).json({ error: "Parol noto'g'ri" });
  if (req.method === 'POST') {
    const v = (L.bodyOf(req).values) || {};
    for (const k of Object.keys(v)) {
      if (!(k in L.DEFAULTS)) continue;
      const val = String(v[k] == null ? '' : v[k]).slice(0, 4000);
      const r = await L.rpc('mf_cfg_set', { p_k: k, p_v: val === L.DEFAULTS[k] ? '' : val });
      if (r === null) return res.status(502).json({ error: "Saqlab bo'lmadi" });
    }
  }
  const [cfg, me] = await Promise.all([L.getCfg(), L.botUsername()]);
  return res.status(200).json({ cfg, defaults: L.DEFAULTS, bot: me, followupsCron: !!process.env.CRON_SECRET });
};
