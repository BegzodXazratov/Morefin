// Vercel serverless funksiya: lead'ni Telegramga yuboradi.
// Vercel > Settings > Environment Variables: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const name = String(b.name || '').slice(0, 80);
  const phone = String(b.phone || '').slice(0, 30);
  if (!name || phone.replace(/\D/g, '').length < 9) return res.status(400).json({ ok: false, error: 'invalid' });
  const lines = [
    'Yangi lead: Morefin (' + String(b.source || 'sayt') + ')',
    'Ism: ' + name,
    'Telefon: ' + phone
  ];
  if (b.score !== undefined) lines.push('Natija: ' + b.score + '/16 (' + String(b.level || '') + ')');
  if (b.weak) lines.push('Zaif joylar: ' + String(b.weak).slice(0, 200));
  if (b.wantsVideo) lines.push('Videodarslik so\'radi: ha');
  if (b.utm) lines.push('UTM: ' + String(b.utm).slice(0, 200));
  const text = lines.join('\n');
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) { console.log('LEAD (Telegram sozlanmagan):', text); return res.status(200).json({ ok: true, delivered: false }); }
  try {
    const r = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text })
    });
    return res.status(200).json({ ok: r.ok, delivered: r.ok });
  } catch (e) { return res.status(200).json({ ok: false, delivered: false }); }
};
