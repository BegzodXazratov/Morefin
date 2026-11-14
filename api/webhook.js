// Morefin Telegram bot (Vercel webhook). Matnlar va video admin paneldan (Bot sozlamalari) boshqariladi.
// Env: BOT_TOKEN, WEBHOOK_SECRET, ADMIN_CHAT_ID (faqat file_id olish uchun), META_PIXEL_ID, META_CAPI_TOKEN, GERON_WEBHOOK_URL
const L = require('./_lib');
const { tg } = L;
const levelOf = (s) => (s <= 5 ? 'Nazorat yaxshi' : s <= 10 ? "O'rtacha xavf" : 'Yuqori xavf');

function parseStart(text) {
  const p = (text.split(/\s+/)[1] || '').trim();
  let m = /^b(\d{1,2})_([a-z0-9]{4,12})$/.exec(p);
  if (m && +m[1] <= 16) return { source: 'baholash', score: +m[1], id: m[2] };
  m = /^t_([a-z0-9]{4,12})$/.exec(p);
  if (m) return { source: 'taklif', id: m[1] };
  return { source: 'bevosita' };
}

async function sendVsl(chatId, c) {
  if (!c.vsl_file_id) return null;
  const markup = { inline_keyboard: [[{ text: c.gate_btn, callback_data: 'go' }]] };
  const j = await tg('sendVideo', { chat_id: chatId, video: c.vsl_file_id, caption: c.vsl_caption, supports_streaming: true, reply_markup: markup });
  return j && j.ok ? j : null;
}

async function onStart(msg) {
  const chatId = msg.chat.id, u = msg.from || {};
  const info = parseStart(msg.text || '/start');
  const [meta, c] = await Promise.all([L.leadMeta(info.id), L.getCfg()]);
  await L.userStart(u, info.source, info.id, info.score);
  await L.userPatch(u.id, 'unblocked');
  await L.track('bot_start', info.source, u.id, info.id, { score: info.score });
  await L.capi('Lead', { tgId: u.id, meta: meta || {} });

  let hello = L.fill(c.greeting, u.first_name);
  if (info.source === 'baholash') hello += '\n\nTest natijangiz: ' + info.score + '/16 (' + levelOf(info.score) + ').';
  await tg('sendMessage', { chat_id: chatId, text: hello + '\n\n' + L.fill(c.intro, u.first_name) });
  const sent = await sendVsl(chatId, c);
  if (sent) { await L.userPatch(u.id, 'vsl_sent'); await L.track('vsl_sent', info.source, u.id, info.id); }
  else await tg('sendMessage', { chat_id: chatId, text: L.fill(c.no_vsl_text, u.first_name), reply_markup: { inline_keyboard: [[{ text: c.go_btn, url: L.goLink(u.id) }]] } });

  if (process.env.GERON_WEBHOOK_URL) {
    try { await fetch(process.env.GERON_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'bot_start', source: info.source, score: info.score, leadId: info.id, telegramId: u.id, username: u.username }) }); } catch (e) {}
  }
}

async function onCallback(cb) {
  if (cb.data !== 'go' || !cb.message) return tg('answerCallbackQuery', { callback_query_id: cb.id });
  const c = await L.getCfg();
  const need = Math.max(0, parseInt(c.watch_seconds, 10) || 0);
  const age = Math.floor(Date.now() / 1000) - cb.message.date;
  if (age < need) {
    await L.userPatch(cb.from.id, 'gate_blocked');
    await L.track('gate_blocked', null, cb.from.id);
    return tg('answerCallbackQuery', { callback_query_id: cb.id, show_alert: true, text: L.fill(c.gate_wait, cb.from.first_name, need - age).slice(0, 200) });
  }
  await L.userPatch(cb.from.id, 'gate_passed');
  await L.track('gate_passed', null, cb.from.id);
  await L.capi('VSLWatched', { tgId: cb.from.id });
  await tg('editMessageReplyMarkup', { chat_id: cb.message.chat.id, message_id: cb.message.message_id,
    reply_markup: { inline_keyboard: [[{ text: c.go_btn, url: L.goLink(cb.from.id) }]] } });
  return tg('answerCallbackQuery', { callback_query_id: cb.id, text: L.fill(c.gate_done, cb.from.first_name).slice(0, 200) });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || req.headers['x-telegram-bot-api-secret-token'] !== secret) return res.status(401).end();
  try {
    const up = L.bodyOf(req);
    if (up.callback_query) { await onCallback(up.callback_query); return res.status(200).json({ ok: true }); }
    if (up.my_chat_member && up.my_chat_member.chat.type === 'private') {
      const st = up.my_chat_member.new_chat_member && up.my_chat_member.new_chat_member.status;
      await L.userPatch(up.my_chat_member.chat.id, st === 'kicked' ? 'blocked' : 'unblocked');
      if (st === 'kicked') await L.track('bot_blocked', null, up.my_chat_member.chat.id);
      return res.status(200).json({ ok: true });
    }
    const msg = up.message;
    if (msg && msg.chat && msg.chat.type === 'private') {
      const isAdmin = String(msg.chat.id) === String(process.env.ADMIN_CHAT_ID || '');
      const media = msg.video || msg.animation || msg.video_note || (msg.document && /video/.test(msg.document.mime_type || '') ? msg.document : null);
      const photo = msg.photo && msg.photo.length ? msg.photo[msg.photo.length - 1] : null;
      if (isAdmin && (media || photo)) {
        await tg('sendMessage', { chat_id: msg.chat.id, text: (media ? 'Video' : 'Rasm') + " file_id (admin panel → Bot sozlamalari yoki Xabar yuborish ga qo'ying):\n" + (media || photo).file_id });
      } else if (msg.text && msg.text.startsWith('/start')) {
        await onStart(msg);
      } else if (msg.text) {
        const u = msg.from || {}, c = await L.getCfg();
        await L.track('bot_msg', null, u.id, null, { text: msg.text.slice(0, 300) });
        await tg('sendMessage', { chat_id: msg.chat.id, text: L.fill(c.reply_text, u.first_name), reply_markup: { inline_keyboard: [[{ text: c.go_btn, url: L.goLink(u.id) }]] } });
      }
    }
  } catch (e) { console.log('bot xato', e && e.message); }
  return res.status(200).json({ ok: true });
};
