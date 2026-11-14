// Morefin Telegram bot (Vercel webhook).
// Env: BOT_TOKEN, WEBHOOK_SECRET, ADMIN_CHAT_ID, VSL_FILE_ID yoki VSL_CHANNEL_ID+VSL_MESSAGE_ID,
//      WATCH_SECONDS (default 30), SALES_USERNAME, META_PIXEL_ID, META_CAPI_TOKEN, GERON_WEBHOOK_URL
const L = require('./_lib');
const { tg } = L;
const levelOf = (s) => (s <= 5 ? 'Nazorat yaxshi' : s <= 10 ? "O'rtacha xavf" : 'Yuqori xavf');
const watchSec = () => Math.max(0, parseInt(process.env.WATCH_SECONDS || '30', 10) || 0);

function parseStart(text) {
  const p = (text.split(/\s+/)[1] || '').trim();
  let m = /^b(\d{1,2})_([a-z0-9]{4,12})$/.exec(p);
  if (m && +m[1] <= 16) return { source: 'baholash', score: +m[1], id: m[2] };
  m = /^t_([a-z0-9]{4,12})$/.exec(p);
  if (m) return { source: 'taklif', id: m[1] };
  return { source: 'bevosita' };
}

async function sendVsl(chatId) {
  const markup = { inline_keyboard: [[{ text: "Saytga o'tish", callback_data: 'go' }]] };
  const caption = process.env.VSL_CAPTION || "Morefin 2 daqiqada: nima qiladi va qanday boshlanadi";
  if (process.env.VSL_FILE_ID) return tg('sendVideo', { chat_id: chatId, video: process.env.VSL_FILE_ID, caption, supports_streaming: true, reply_markup: markup });
  if (process.env.VSL_CHANNEL_ID && process.env.VSL_MESSAGE_ID)
    return tg('copyMessage', { chat_id: chatId, from_chat_id: process.env.VSL_CHANNEL_ID, message_id: +process.env.VSL_MESSAGE_ID, reply_markup: markup });
  return null;
}

async function notifyAdmin(text) {
  if (process.env.ADMIN_CHAT_ID) await tg('sendMessage', { chat_id: process.env.ADMIN_CHAT_ID, text });
}

async function onStart(msg) {
  const chatId = msg.chat.id, u = msg.from || {};
  const info = parseStart(msg.text || '/start');
  const meta = (await L.leadMeta(info.id)) || {};
  await L.userStart(u, info.source, info.id, info.score);
  await L.track('bot_start', info.source, u.id, info.id, { score: info.score });
  await L.capi('Lead', { tgId: u.id, meta });

  const name = u.first_name || "do'stim";
  let hello = 'Assalomu alaykum, ' + name + '! Morefin botiga xush kelibsiz.';
  if (info.source === 'baholash') hello += '\n\nTest natijangiz: ' + info.score + '/16 (' + levelOf(info.score) + ').';
  await tg('sendMessage', { chat_id: chatId, text: hello + "\n\nMorefin'ga kirishdan oldin quyidagi qisqa video bilan tanishib chiqing:" });
  const sent = await sendVsl(chatId);
  if (sent) { await L.userPatch(u.id, 'vsl_sent'); await L.track('vsl_sent', info.source, u.id, info.id); }

  await tg('sendMessage', { chat_id: chatId, text: "Savollaringizga sotuvchi yordam bera olishi uchun telefon raqamingizni ulashing (ixtiyoriy).",
    reply_markup: { keyboard: [[{ text: 'Telefon raqamni ulashish', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true } });

  const lines = ['Botga kirdi: ' + [u.first_name, u.last_name].filter(Boolean).join(' '),
    'Username: ' + (u.username ? '@' + u.username : "yo'q"), 'Telegram ID: ' + u.id,
    'Manba: ' + info.source + (info.score !== undefined ? ' (natija ' + info.score + '/16)' : ''), 'Lead kodi: ' + (info.id || '-')];
  if (!sent) lines.push("DIQQAT: VSL video sozlanmagan, foydalanuvchiga yuborilmadi.");
  await notifyAdmin(lines.join('\n'));
  if (process.env.GERON_WEBHOOK_URL) {
    try { await fetch(process.env.GERON_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'bot_start', source: info.source, score: info.score, leadId: info.id, telegramId: u.id, username: u.username }) }); } catch (e) {}
  }
}

async function onContact(msg) {
  const c = msg.contact, u = msg.from || {};
  if (!c || c.user_id !== u.id) return tg('sendMessage', { chat_id: msg.chat.id, text: "Iltimos, o'zingizning raqamingizni tugma orqali ulashing." });
  await L.userPatch(u.id, 'phone', c.phone_number);
  await L.track('phone_shared', null, u.id);
  await L.capi('Contact', { tgId: u.id, phone: c.phone_number });
  await tg('sendMessage', { chat_id: msg.chat.id, text: 'Rahmat! Raqamingiz qabul qilindi.', reply_markup: { remove_keyboard: true } });
  await notifyAdmin('Telefon: ' + c.phone_number + '\n' + (u.username ? '@' + u.username : 'ID ' + u.id));
}

async function onCallback(cb) {
  if (cb.data !== 'go' || !cb.message) return tg('answerCallbackQuery', { callback_query_id: cb.id });
  const age = Math.floor(Date.now() / 1000) - cb.message.date, need = watchSec();
  if (age < need) {
    await L.userPatch(cb.from.id, 'gate_blocked');
    await L.track('gate_blocked', null, cb.from.id);
    return tg('answerCallbackQuery', { callback_query_id: cb.id, show_alert: true, text: "Oldin videoni ko'ring. Havola taxminan " + (need - age) + " soniyadan keyin ochiladi." });
  }
  await L.userPatch(cb.from.id, 'gate_passed');
  await L.track('gate_passed', null, cb.from.id);
  await L.capi('VSLWatched', { tgId: cb.from.id });
  await tg('editMessageReplyMarkup', { chat_id: cb.message.chat.id, message_id: cb.message.message_id,
    reply_markup: { inline_keyboard: [[{ text: "Morefin'ga kirish", url: L.goLink(cb.from.id) }]] } });
  return tg('answerCallbackQuery', { callback_query_id: cb.id, text: "Tayyor! Endi tugma ishlaydi." });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || req.headers['x-telegram-bot-api-secret-token'] !== secret) return res.status(401).end();
  try {
    const up = L.bodyOf(req);
    if (up.callback_query) { await onCallback(up.callback_query); return res.status(200).json({ ok: true }); }
    const msg = up.message;
    if (msg && msg.chat && msg.chat.type === 'private') {
      const isAdmin = String(msg.chat.id) === String(process.env.ADMIN_CHAT_ID || '');
      const media = msg.video || msg.animation || msg.video_note || (msg.document && /video/.test(msg.document.mime_type || '') ? msg.document : null);
      if (isAdmin && media) {
        await tg('sendMessage', { chat_id: msg.chat.id, text: "VSL file_id (Vercel'da VSL_FILE_ID ga qo'ying):\n" + media.file_id });
      } else if (msg.contact) {
        await onContact(msg);
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
