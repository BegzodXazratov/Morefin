// Admin: bosqich bo'yicha post yuborish.
// POST { segment: all|watching|early|passed|clicked|test, text, media?, mediaType?: video|photo, btnText?, btnMode?: none|go|url, btnUrl? }
// Matnda {name} o'rniga ism qo'yiladi. "test" faqat ADMIN_CHAT_ID ga yuboradi.
const L = require('./_lib');
const SEG = ['all', 'watching', 'early', 'passed', 'clicked', 'test', 'one'];
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (!L.adminOk(req)) return res.status(401).json({ error: "Parol noto'g'ri" });
  const b = L.bodyOf(req);
  const text = String(b.text || '').trim().slice(0, 1000), media = String(b.media || '').trim() || null;
  const TYPES = ['text', 'photo', 'video', 'animation', 'video_note', 'voice', 'audio', 'document'];
  const mtype = TYPES.includes(b.mediaType) ? b.mediaType : (media ? 'video' : 'text');
  if (!SEG.includes(b.segment)) return res.status(400).json({ error: "Bosqich noto'g'ri" });
  if (!text && !media) return res.status(400).json({ error: 'Matn yoki media kerak' });
  let btn = null;
  if (b.btnMode === 'gate') btn = { text: String(b.btnText || "Saytga o'tish").slice(0, 60), callback: 'go' };
  else if (b.btnMode === 'go') btn = { text: String(b.btnText || "Morefin'ga kirish").slice(0, 60), go: true };
  else if (b.btnMode === 'url') {
    if (!/^https:\/\/\S+$/.test(String(b.btnUrl || ''))) return res.status(400).json({ error: 'Tugma havolasi https:// bilan boshlanishi kerak' });
    btn = { text: String(b.btnText || 'Ochish').slice(0, 60), url: b.btnUrl };
  }
  let list;
  if (b.segment === 'one') {
    if (!/^\d{1,15}$/.test(String(b.tgId || ''))) return res.status(400).json({ error: 'tg_id kerak' });
    list = [{ tg_id: +b.tgId, first_name: b.name || '' }];
  } else if (b.segment === 'test') {
    if (!process.env.ADMIN_CHAT_ID) return res.status(400).json({ error: 'ADMIN_CHAT_ID sozlanmagan' });
    list = [{ tg_id: +process.env.ADMIN_CHAT_ID, first_name: 'Admin' }];
  } else {
    list = await L.rpc('mf_segment', { p_seg: b.segment });
    if (!list) return res.status(502).json({ error: "Bazadan o'qib bo'lmadi" });
  }
  let sent = 0, failed = 0;
  for (let i = 0; i < list.length; i += 20) {
    const part = list.slice(i, i + 20);
    const r = await Promise.all(part.map((u) => L.sendTo(u.tg_id, { text: text.replace(/\{name\}/g, u.first_name || "do'stim"), type: mtype, media, btn }).catch(() => false)));
    r.forEach((ok) => (ok ? sent++ : failed++));
  }
  if (b.segment !== 'test') await L.track('broadcast', null, b.segment === 'one' ? +b.tgId : null, b.segment, { sent, failed, text: text.slice(0, 80) });
  return res.status(200).json({ ok: true, total: list.length, sent, failed });
};
