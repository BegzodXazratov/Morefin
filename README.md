# Morefin (bitta loyiha)

Bitta Vercel loyiha `morefin`, bitta repo:

- `/baholash/` biznes moliyasi testi -> Telegram bot
- `/taklif/` Morefin tanishtiruvi, eng pastda "Telegram orqali kirish"
- `/admin` admin panel (ADMIN_PASSWORD)
- `/api/*` bot webhook, track, go, setup, admin

## Sozlash
1. `baholash/config.js` va `taklif/config.js`: `pixelId`, `botUsername`.
2. Vercel env: `BOT_TOKEN`, `WEBHOOK_SECRET`, `ADMIN_CHAT_ID`, `VSL_FILE_ID`, `ADMIN_PASSWORD`, `META_PIXEL_ID`, `META_CAPI_TOKEN`, ixtiyoriy `WATCH_SECONDS`, `PUBLIC_URL`, `APP_URL`, `GERON_WEBHOOK_URL`.
3. Bir marta: `/api/setup?key=<WEBHOOK_SECRET>`.
4. VSL file_id: videoni botga ADMIN_CHAT_ID akkauntidan yuboring.

Voronka: sayt -> bot `/start` -> VSL + gate tugma -> `/api/go` -> app.morefin.uz. Pixel saytlarda, botda Conversions API. Ma'lumot Supabase `tasma` loyihasidagi `mf_*` jadvallarda.
