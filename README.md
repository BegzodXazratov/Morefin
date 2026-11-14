# Morefin (bitta loyiha)

Bitta Vercel loyiha `morefin`, bitta repo:

- `/baholash/` biznes moliyasi testi -> Telegram bot
- `/taklif/` Morefin tanishtiruvi, eng pastda "Telegram orqali kirish"
- `/admin` boshqaruv paneli (ADMIN_PASSWORD): umumiy voronka, reklama (UTM), odamlar, xabar yuborish, bot sozlamalari
- `/api/*` bot webhook, track, go, setup, admin

## Sozlash
1. `baholash/config.js` va `taklif/config.js`: `pixelId`, `botUsername`.
2. Vercel env: `CRON_SECRET` (kunlik eslatma), `BOT_TOKEN`, `WEBHOOK_SECRET`, `ADMIN_CHAT_ID`, `VSL_FILE_ID`, `ADMIN_PASSWORD`, `META_PIXEL_ID`, `META_CAPI_TOKEN`, ixtiyoriy `WATCH_SECONDS`, `PUBLIC_URL`, `APP_URL`, `GERON_WEBHOOK_URL`.
3. Bir marta: `/api/setup?key=<WEBHOOK_SECRET>`.
4. VSL file_id: videoni botga ADMIN_CHAT_ID akkauntidan yuboring.

Voronka: sayt -> bot `/start` -> VSL + gate tugma -> `/api/go` -> app.morefin.uz. Pixel saytlarda, botda Conversions API. Ma'lumot Supabase `tasma` loyihasidagi `mf_*` jadvallarda.

Bot matnlari, VSL file_id, gate vaqti va eslatma matnlari admin paneldagi "Bot sozlamalari"da (Supabase mf_settings, cfg:*). Kunlik eslatma: Vercel Cron 05:00 UTC (10:00 Toshkent) `/api/cron`.
Meta reklama URL parametrlari: `utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}`.
