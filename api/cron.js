// Kunlik eslatma (Vercel Cron, har kuni 10:00 Toshkent): botga kirgan, lekin Morefin saytiga o'tmaganlarga qayta yozadi.
// Jadval: boshlagandan 1, 2, 4, 7, 10, 14 kun. Videoni ko'rmaganlarga video qayta, ko'rganlarga saytga havola.
// Matnlar admin panel → Bot sozlamalari → Eslatmalar.
const L = require('./_lib');
module.exports = async (req, res) => {
  const cs = process.env.CRON_SECRET;
  if (!cs || req.headers.authorization !== 'Bearer ' + cs) return res.status(401).end();
  const c = await L.getCfg();
  if (c.followups_on !== '1') return res.status(200).json({ ok: true, off: true });
  const due = await L.rpc('mf_due', { p_limit: 200 });
  if (!due) return res.status(502).json({ ok: false });
  let sent = 0, failed = 0;
  for (let i = 0; i < due.length; i += 20) {
    await Promise.all(due.slice(i, i + 20).map(async (u) => {
      const n = Math.min(u.n, 5) + 1;
      const ok = u.passed
        ? await L.sendTo(u.tg_id, { text: L.fill(c['fu_site_' + n], u.first_name), btn: { text: c.go_btn, go: true } })
        : await L.sendTo(u.tg_id, { text: L.fill(c['fu_watch_' + n], u.first_name), media: c.vsl_file_id || null, mediaType: 'video', btn: c.vsl_file_id ? { text: c.gate_btn, callback: 'go' } : { text: c.go_btn, go: true } });
      if (ok) { await L.userPatch(u.tg_id, 'remind'); sent++; } else failed++;
    }));
  }
  if (due.length) await L.track('followup', null, null, null, { sent, failed });
  return res.status(200).json({ ok: true, due: due.length, sent, failed });
};
