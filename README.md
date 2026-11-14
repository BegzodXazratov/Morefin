# Morefin: Meta Ads voronkalari

Ikki mustaqil sayt (har biri alohida Vercel loyihasi, rootDirectory orqali):

- `baholash/` biznes moliyasi testi (8 savol, ism+telefon, natija, Morefin taklifi)
- `taklif/` Abdusattor Abdurahimov taklifi (7 kun bepul, forma)

## Sozlash
1. `config.js` ichida `pixelId` (Meta Pixel) va `telegramUrl` ni to'ldiring.
2. Vercel loyiha sozlamalarida env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (leadlar Telegramga tushadi).
3. `taklif/index.html` da Abdusattor rasmi va video joyi belgilangan.

## Telegram bot (`bot/`)
Saytlardagi forma tugagach foydalanuvchi botga o'tadi (`config.js` da `botUsername`). Bot VSL videoni yuboradi va adminga xabar beradi.
Vercel env (loyiha `morefin-bot`): `BOT_TOKEN`, `WEBHOOK_SECRET` (o'zingiz o'ylab topgan uzun kalit), `ADMIN_CHAT_ID`, `VSL_FILE_ID` (yoki `VSL_CHANNEL_ID` + `VSL_MESSAGE_ID`), ixtiyoriy `SALES_USERNAME`, `APP_URL`, `GERON_WEBHOOK_URL`.
Bir marta: `https://<bot-loyiha>.vercel.app/api/setup?key=<WEBHOOK_SECRET>` ni oching.
VSL file_id olish: videoni botga o'zingiz (ADMIN_CHAT_ID akkaunti) yuboring, bot file_id ni javob qiladi.
