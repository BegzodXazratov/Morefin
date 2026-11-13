# Morefin: Meta Ads voronkalari

Ikki mustaqil sayt (har biri alohida Vercel loyihasi, rootDirectory orqali):

- `baholash/` biznes moliyasi testi (8 savol, ism+telefon, natija, Morefin taklifi)
- `taklif/` Abdusattor Abdurahimov taklifi (7 kun bepul, forma)

## Sozlash
1. `config.js` ichida `pixelId` (Meta Pixel) va `telegramUrl` ni to'ldiring.
2. Vercel loyiha sozlamalarida env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (leadlar Telegramga tushadi).
3. `taklif/index.html` da Abdusattor rasmi va video joyi belgilangan.
