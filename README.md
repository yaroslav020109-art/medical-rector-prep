# Medical Rector Prep

Сайт для підготовки до ректорського контролю. Доступ за загальним кодом, окремий
код для адмінки. Адмін бачить кількість унікальних пристроїв і може повністю
заблокувати сайт (після цього жоден користувач не зайде, поки адмін не
розблокує).

## Стек

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS v4
- TypeScript
- Vercel KV (Upstash Redis) для невеликого стану (лок-флаг, лічильник пристроїв,
  session epoch). Локально fallback'ить на in-memory.

Питання (Біологія / Гістологія / Анатомія) живуть у `data/questions.json`. Ключ
із правильними відповідями для іспитового режиму шифрується AES-256-GCM і
повертається на сервер тільки під час оцінювання.

## Локальна розробка

```bash
cp .env.example .env.local
# відредагуй .env.local: вкажи SESSION_SECRET, USER_ACCESS_CODE, ADMIN_ACCESS_CODE
npm install
npm run dev
```

Локально база — in-memory (стан скидається при перезапуску, це нормально).

## Деплой на Vercel

1. **Натисни «Deploy»:**

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyaroslav020109-art%2Fmedical-rector-prep&env=SESSION_SECRET,USER_ACCESS_CODE,ADMIN_ACCESS_CODE,MONOBANK_JAR_URL&envDescription=SESSION_SECRET%20%E2%80%94%2032%2B%20random%20bytes%20%28openssl%20rand%20-hex%2032%29.%20USER_ACCESS_CODE%20%E2%80%94%20%D0%BA%D0%BE%D0%B4%20%D0%B4%D0%BB%D1%8F%20%D0%BA%D0%BE%D1%80%D0%B8%D1%81%D1%82%D1%83%D0%B2%D0%B0%D1%87%D1%96%D0%B2.%20ADMIN_ACCESS_CODE%20%E2%80%94%20%D0%BA%D0%BE%D0%B4%20%D0%B4%D0%BB%D1%8F%20%D0%B0%D0%B4%D0%BC%D1%96%D0%BD%D0%BA%D0%B8.%20MONOBANK_JAR_URL%20%E2%80%94%20%D0%BB%D0%B0%D0%BD%D0%BA%D0%B0%20%D0%BD%D0%B0%20%D0%B1%D0%B0%D0%BD%D0%BA%D1%83.&project-name=medical-rector-prep&repository-name=medical-rector-prep)

   Vercel створить репозиторій у твоєму GitHub-акаунті, попросить заповнити
   змінні середовища і запустить перший деплой.

2. **Додай Vercel KV (зберігання стану локдауну та лічильника):**

   - Vercel Dashboard → твій проект → **Storage** → **Create Database**
   - Обери **Upstash for Redis** (Marketplace) → Free Plan → Create
   - Connect to Project → обери `medical-rector-prep` → Connect
   - Vercel автоматично додасть env vars `KV_REST_API_URL`, `KV_REST_API_TOKEN`
     і запустить редеплой

3. **Готово.** Після другого деплою:
   - користувачі заходять за `USER_ACCESS_CODE` на головну
   - ти заходиш у `/admin/login` за `ADMIN_ACCESS_CODE`
   - можеш блокувати/розблоковувати сайт із адмінки

## Видалити сайт

Vercel Dashboard → проект → **Settings** → внизу **Delete Project** → підтвердити.
KV-база видаляється разом з проектом (якщо була під'єднана через Marketplace).
