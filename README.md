# Morefin: Meta Ads voronkalari

Ikki mustaqil sayt (har biri alohida Vercel loyihasi, rootDirectory orqali) va bitta bot:

- `baholash/` biznes moliyasi testi (8 savol) -> natija, kamchiliklar, Morefin taklifi -> Telegram bot
- `taklif/` Morefin tanishtiruvi, eng pastda "Telegram orqali kirish" -> Telegram bot
- `bot/` Telegram bot (VSL + gate), hodisalar bazasi, admin panel (`/admin`)

## Sozlash
1. Ikkala `config.js` da: `pixelId` (Meta Pixel) va `botUsername` (@siz).
2. Bot Vercel loyihasi `morefin-bot` env: `BOT_TOKEN`, `WEBHOOK_SECRET`, `ADMIN_CHAT_ID`, `VSL_FILE_ID` (yoki `VSL_CHANNEL_ID` + `VSL_MESSAGE_ID`), `ADMIN_PASSWORD`, `META_PIXEL_ID`, `META_CAPI_TOKEN`, ixtiyoriy `WATCH_SECONDS`, `APP_URL`, `GERON_WEBHOOK_URL`.
3. Bir marta: `https://morefin-bot.vercel.app/api/setup?key=<WEBHOOK_SECRET>` ni oching.
4. VSL file_id: videoni botga ADMIN_CHAT_ID akkauntidan yuboring, bot file_id qaytaradi.

## Voronka
Sayt -> `/start b<ball>_<id>` yoki `t_<id>` -> salom + VSL + "Saytga o'tish" tugmasi. WATCH_SECONDS o'tmasdan bosilsa "Oldin videoni ko'ring" chiqadi, keyin tugma `/api/go` orqali Morefin'ga olib boradi.

## Pixel
Pixel faqat saytlarda. Botdagi harakatlar Meta Conversions API orqali (Lead, Contact, VSLWatched, AppClick), sayt `bot_click` hodisasidagi fbp/fbc bilan bog'lanadi.

## Admin panel
`https://morefin-bot.vercel.app/admin` (ADMIN_PASSWORD): saytga kirish, botga o'tish, qolib ketganlar, VSL ko'rganlar, saytgacha yetganlar. Ma'lumot Supabase `tasma` loyihasidagi `mf_*` jadvallarda.
