// Bir marta ochiladi: Telegram webhook'ni shu loyiha manziliga ulaydi (xavfsiz: faqat o'z manzilingizni ulaydi).
module.exports = async (req, res) => {
  const secret = process.env.WEBHOOK_SECRET, token = process.env.BOT_TOKEN;
  if (!secret || !token) return res.status(500).json({ ok: false, error: 'BOT_TOKEN va WEBHOOK_SECRET env kerak' });
  const url = (process.env.PUBLIC_URL || ('https://' + (process.env.VERCEL_PROJECT_PRODUCTION_URL || 'morefin.vercel.app'))) + '/api/webhook';
  const r = await fetch('https://api.telegram.org/bot' + token + '/setWebhook', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, secret_token: secret, allowed_updates: ['message', 'callback_query', 'my_chat_member'] })
  });
  const j = await r.json();
  return res.status(200).json({ ok: j.ok, description: j.description, webhook: url });
};
