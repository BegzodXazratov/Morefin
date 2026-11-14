// Morefin Telegram bot (Vercel serverless webhook), tashqi kutubxonasiz.
// Env: BOT_TOKEN, WEBHOOK_SECRET, ADMIN_CHAT_ID, APP_URL (ixtiyoriy),
//      VSL_FILE_ID  yoki  VSL_CHANNEL_ID + VSL_MESSAGE_ID, SALES_USERNAME (ixtiyoriy),
//      VSL_CAPTION (ixtiyoriy), GERON_WEBHOOK_URL (ixtiyoriy)
async function tg(method, body) {
  const r = await fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/' + method, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  return r.json().catch(() => ({}));
}
const levelOf = (s) => (s <= 5 ? 'Nazorat yaxshi' : s <= 10 ? "O'rtacha xavf" : 'Yuqori xavf');

function parseStart(text) {
  const p = (text.split(/\s+/)[1] || '').trim();
  let m = /^b(\d{1,2})_([a-z0-9]{4,12})$/.exec(p);
  if (m && +m[1] <= 16) return { source: 'baholash', score: +m[1], id: m[2] };
  m = /^t_([a-z0-9]{4,12})$/.exec(p);
  if (m) return { source: 'taklif', id: m[1] };
  return { source: 'bevosita' };
}

async function sendVsl(chatId) {
  const caption = process.env.VSL_CAPTION || "Morefin 2 daqiqada: nima qiladi va qanday boshlanadi";
  if (process.env.VSL_FILE_ID) return tg('sendVideo', { chat_id: chatId, video: process.env.VSL_FILE_ID, caption, supports_streaming: true });
  if (process.env.VSL_CHANNEL_ID && process.env.VSL_MESSAGE_ID)
    return tg('copyMessage', { chat_id: chatId, from_chat_id: process.env.VSL_CHANNEL_ID, message_id: +process.env.VSL_MESSAGE_ID });
  return null;
}

async function notifyAdmin(text) {
  if (process.env.ADMIN_CHAT_ID) await tg('sendMessage', { chat_id: process.env.ADMIN_CHAT_ID, text });
}

async function onStart(msg) {
  const chatId = msg.chat.id, u = msg.from || {};
  const info = parseStart(msg.text || '/start');
  const name = u.first_name || 'do\'stim';
  let hello = 'Assalomu alaykum, ' + name + '! Morefin botiga xush kelibsiz.';
  if (info.source === 'baholash') hello += '\n\nTest natijangiz: ' + info.score + '/16 (' + levelOf(info.score) + ').';
  await tg('sendMessage', { chat_id: chatId, text: hello + '\n\nQisqa videoda Morefin nima qilishini ko\'rsatamiz:' });
  const sent = await sendVsl(chatId);
  const kb = [[{ text: '7 kun bepul sinash', url: process.env.APP_URL || 'https://app.morefin.uz/' }]];
  if (process.env.SALES_USERNAME) kb.push([{ text: 'Savol berish', url: 'https://t.me/' + process.env.SALES_USERNAME.replace(/^@/, '') }]);
  await tg('sendMessage', { chat_id: chatId, text: 'Tayyor bo\'lsangiz, platformaga kiring. Telegram yoki Google orqali kirasiz, 7 kun bepul.', reply_markup: { inline_keyboard: kb } });
  const lines = ['Botga kirdi: ' + [u.first_name, u.last_name].filter(Boolean).join(' '),
    'Username: ' + (u.username ? '@' + u.username : 'yo\'q'), 'Telegram ID: ' + u.id,
    'Manba: ' + info.source + (info.score !== undefined ? ' (natija ' + info.score + '/16)' : ''), 'Lead kodi: ' + (info.id || '-')];
  if (!sent) lines.push('DIQQAT: VSL video sozlanmagan, foydalanuvchiga yuborilmadi.');
  await notifyAdmin(lines.join('\n'));
  if (process.env.GERON_WEBHOOK_URL) {
    try { await fetch(process.env.GERON_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'bot_start', source: info.source, score: info.score, leadId: info.id, telegramId: u.id, username: u.username }) }); } catch (e) {}
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || req.headers['x-telegram-bot-api-secret-token'] !== secret) return res.status(401).end();
  try {
    const up = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const msg = up.message;
    if (msg && msg.chat && msg.chat.type === 'private') {
      const isAdmin = String(msg.chat.id) === String(process.env.ADMIN_CHAT_ID || '');
      const media = msg.video || msg.animation || msg.video_note || (msg.document && /video/.test(msg.document.mime_type || '') ? msg.document : null);
      if (isAdmin && media) {
        await tg('sendMessage', { chat_id: msg.chat.id, text: 'VSL file_id (Vercel\'da VSL_FILE_ID ga qo\'ying):\n' + media.file_id });
      } else if (msg.text && msg.text.startsWith('/start')) {
        await onStart(msg);
      } else if (msg.text) {
        await tg('sendMessage', { chat_id: msg.chat.id, text: 'Rahmat! Savolingiz jamoamizga yetkazildi, tez orada javob beramiz.' });
        const u = msg.from || {};
        await notifyAdmin('Xabar: ' + (u.username ? '@' + u.username : u.id) + '\n' + msg.text.slice(0, 500));
      }
    }
  } catch (e) { console.log('bot xato', e && e.message); }
  return res.status(200).json({ ok: true });
};
