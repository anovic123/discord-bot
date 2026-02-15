# Discord Bot

Многофункциональный Discord бот с модерацией, утилитами, курсами валют/крипты, погодой, AI-командами (Groq/OpenAI с настраиваемыми моделями и ключами через Discord UI), логированием событий в ЛС, переводами, toxic-mode и 70 slash командами.

## Установка

```bash
git clone https://github.com/anovic123/discord-bot.git
cd discord-bot
npm install
```

## Переменные окружения

Создайте файл `.env`:

| Переменная | Описание | Обязательная |
|------------|----------|--------------|
| `DISCORD_TOKEN` | Токен Discord бота | Да |
| `CHANNEL_ID` | ID канала для уведомлений | Да |
| `GUILD_ID` | ID сервера | Да |
| `WELCOME_CHANNEL_ID` | ID канала приветствий (startup-сообщение + приветствие новых участников) | Нет |
| `CRON_TIME` | Расписание cron (по умолчанию: `0 9 * * *`) | Нет |
| `TIMEZONE` | Часовой пояс (по умолчанию: `Europe/Kyiv`) | Нет |
| `LOG_LEVEL` | Уровень логирования: `debug`, `info`, `warn`, `error` (по умолчанию: `info`) | Нет |
| `OPENWEATHER_API_KEY` | API ключ OpenWeather. Без него команды погоды не работают | Нет |
| `GROQ_API_KEY` | API ключ Groq (fallback, если не задан в `/settings`). Без него и без ключа в настройках AI-команды не работают | Нет |
| `OPENAI_API_KEY` | API ключ OpenAI (fallback, если не задан в `/settings`) | Нет |
| `ENCRYPTION_KEY` | 64 hex-символа (32 байта) для шифрования API ключей. Если не задан — автогенерация в `data/encryption.key` | Нет |

### Privileged Intents

В **Discord Developer Portal → Bot → Privileged Gateway Intents** необходимо включить:

- **Server Members Intent** — для приветствий и логирования входа/выхода участников
- **Message Content Intent** — для логирования содержимого удалённых/отредактированных сообщений

## Запуск

### Локально

```bash
npm run build
npm start
```

### Docker

```bash
docker-compose up -d
```

## Ежедневный отчёт

Каждый день в 9:00 (настраивается через `CRON_TIME`) бот может отправлять в канал:

1. Курсы валют (USD/EUR/PLN к гривне)
2. Курсы криптовалют (BTC, ETH, SOL и др.)
3. Статистику сервера — участники, онлайн, голосовые, каналы, бусты, роли, эмодзи

Все секции **отключены по умолчанию** — включайте нужные через `/settings`.

## Настройки (`/settings`)

Управление настройками бота через интерактивный Discord UI. 5 категорий:

| Категория | Описание |
|-----------|----------|
| 📊 Ежедневный отчёт | Курсы валют, крипто, статистика сервера |
| 👋 Приветствие | Сообщение при запуске, приветствие новых участников |
| 🛡️ Модерация | Аудит лог |
| 🤖 AI | Вкл/выкл `/ask`, `/roast`, `/ai-summary`, провайдер (Groq/OpenAI), модель, API ключи, лимит запросов/день, кулдаун, температура |
| 📝 Логирование | Получатели логов (DM), удаление/редактирование сообщений, вход/выход участников, смена никнеймов, голосовая активность |

- Boolean-настройки управляются тогглами (ON/OFF)
- Числовые настройки (лимит, кулдаун, температура) — через модалку "⚙️ Параметры"
- AI провайдер — кнопки Groq / OpenAI
- Модель — StringSelectMenu с доступными моделями провайдера
- API ключи — модалка "🔑 API Key" (шифруются AES-256-GCM, пустое = fallback на env var)
- Получатели логов — UserSelectMenu (до 10 юзеров)
- Быстрый поиск: `/settings search:AI` — фильтрует настройки по ключевому слову

## Логирование событий

При настроенных получателях (`/settings` → 📝 Логирование → UserSelectMenu) бот отправляет эмбеды в личные сообщения:

- 🗑️ Удаление сообщений
- ✏️ Редактирование сообщений
- 📥 Вход новых участников
- 👋 Выход участников
- 📛 Смена никнеймов
- 🔊 Голосовая активность (подключение, отключение, перемещение)

Каждый тип логирования можно включить/выключить отдельно. Логи отправляются в DM выбранным пользователям (до 10).

## AI

AI-команды (`/ask`, `/roast`, `/ai-summary`, `/toxic-mode`) поддерживают:

- Провайдер: **Groq** (llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768, gemma2-9b-it) или **OpenAI** (gpt-4o-mini, gpt-4o, gpt-3.5-turbo)
- API ключи задаются через `/settings` (шифруются AES-256-GCM) или через переменные окружения (fallback)
- Модель выбирается в `/settings` через выпадающий список
- Включение/выключение каждой команды отдельно через `/settings`
- Лимит запросов на пользователя в день (по умолчанию 50)
- Кулдаун между запросами (по умолчанию 10 сек)
- Настраиваемая температура модели (по умолчанию 0.7)

## HTTP эндпоинты

| Эндпоинт | Описание |
|----------|----------|
| `GET /health` | Статус здоровья бота |
| `GET /stats` | Статистика сервера (участники, онлайн, голосовые, каналы, бусты) |

## Команды бота

### Модерация
`/ban`, `/tempban`, `/unban`, `/kick`, `/timeout`, `/untimeout`, `/warn`, `/purge`, `/clear`, `/lock`, `/unlock`, `/hide`, `/show`, `/slowmode`, `/slowoff`, `/role`, `/nick`, `/nickname`, `/setnick`, `/moveall`, `/voicekick`, `/voicemute`, `/voiceunmute`, `/deafen`, `/undeafen`, `/banlist`, `/announce`, `/dm`, `/settings`, `/welcome-message`

### Информация
`/userinfo`, `/whois`, `/serverinfo`, `/channelinfo`, `/roleinfo`, `/roles`, `/members`, `/invites`, `/boosters`, `/emojis`, `/stats`, `/uptime`, `/servertime`, `/summary`

### Утилиты
`/avatar`, `/banner`, `/servericon`, `/serverbanner`, `/firstmessage`, `/poll`, `/reminder`, `/translate`, `/weather`, `/qr`, `/timestamp`

### Финансы
`/currency`, `/crypto`, `/convert`

### Развлечения
`/8ball`, `/coinflip`, `/roll`, `/random`, `/choose`

### Текст и кодирование
`/math`, `/base64`, `/reverse`, `/jumbo`, `/color`, `/password`, `/hash`, `/say`, `/embed`, `/stealemoji`

### AI (Groq / OpenAI)
`/ai-summary`, `/ask`, `/roast`, `/toxic-mode`

### Прочее
`/ping`, `/help`

## Лицензия

MIT
