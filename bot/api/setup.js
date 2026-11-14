// Bir marta ochiladi: /api/setup?key=WEBHOOK_SECRET  (Telegram webhook'ni shu manzilga ulaydi)
module.exports = async (req, res) => {
  const secret = process.env.WEBHOOK_SECRET, token = process.env.BOT_TOKEN;
  if (!secret || !token) return res.status(500).json({ ok: false, error: 'BOT_TOKEN va WEBHOOK_SECRET env kerak' });
  if (req.query.key !== secret) return res.status(401).json({ ok: false });
  const url = 'https://' + req.headers.host + '/api/webhook';
  const r = await fetch('https://api.telegram.org/bot' + token + '/setWebhook', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, secret_token: secret, allowed_updates: ['message'] })
  });
  const j = await r.json();
  return res.status(200).json({ ok: j.ok, description: j.description, webhook: url });
};
