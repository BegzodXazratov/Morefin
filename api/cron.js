// Kunlik eslatma (Vercel Cron, har kuni 10:00 Toshkent): botga kirgan, lekin Morefin saytiga o'tmaganlarga qayta yozadi.
// Har qadam (kun, matn, media, tugma) admin panel → Bot sozlamalari → Eslatmalar da.
// "watch" = videoni ko'rmaganlar, "site" = ko'rgan, lekin saytga o'tmaganlar. Ikkala ro'yxat bir xil kunlarda ishlaydi.
const L = require('./_lib');
function btnOf(st, c) {
  if (st.btn === 'none') return null;
  if (st.btn === 'gate') return c.vsl_file_id ? { text: st.btnText || c.gate_btn, callback: 'go' } : { text: st.btnText || c.go_btn, go: true };
  if (st.btn === 'url' && /^https:\/\//.test(st.url || '')) return { text: st.btnText || 'Ochish', url: st.url };
  return { text: st.btnText || c.go_btn, go: true };
}
module.exports = async (req, res) => {
  const cs = process.env.CRON_SECRET;
  if (!cs || req.headers.authorization !== 'Bearer ' + cs) return res.status(401).end();
  const c = await L.getCfg();
  if (c.followups_on !== '1') return res.status(200).json({ ok: true, off: true });
  const days = c.fu.watch.map((s) => Math.max(0, +s.day || 0));
  const due = await L.rpc('mf_due2', { p_limit: 200, p_days: days });
  if (!due) return res.status(502).json({ ok: false });
  let sent = 0, failed = 0;
  for (let i = 0; i < due.length; i += 20) {
    await Promise.all(due.slice(i, i + 20).map(async (u) => {
      const list = u.passed ? c.fu.site : c.fu.watch, st = list[u.n] || list[list.length - 1];
      const type = st.type === 'vsl' ? 'video' : st.type, media = st.type === 'vsl' ? c.vsl_file_id : st.media;
      const ok = await L.sendTo(u.tg_id, { text: L.fill(st.text, u.first_name), type, media, btn: btnOf(st, c) });
      if (ok) { await L.userPatch(u.tg_id, 'remind'); sent++; } else failed++;
    }));
  }
  if (due.length) await L.track('followup', null, null, null, { sent, failed });
  return res.status(200).json({ ok: true, due: due.length, sent, failed });
};
module.exports.btnOf = btnOf;
