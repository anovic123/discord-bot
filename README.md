# Discord Bot

Многофункциональный Discord бот с модерацией, утилитами, курсами валют/крипты, погодой, переводами и 70+ slash командами.

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
| `WELCOME_CHANNEL_ID` | ID канала приветствий | Нет |
| `CRON_TIME` | Расписание cron (по умолчанию: `0 9 * * *`) | Нет |
| `TIMEZONE` | Часовой пояс (по умолчанию: `Europe/Kyiv`) | Нет |
| `LOG_LEVEL` | Уровень логирования: `debug`, `info`, `warn`, `error` (по умолчанию: `info`) | Нет |
| `OPENWEATHER_API_KEY` |  API ключ OpenWeather. Без него команды погоды не работают | Нет |

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

## Команды бота

### Модерация
`/ban`, `/unban`, `/kick`, `/timeout`, `/untimeout`, `/warn`, `/purge`, `/clear`, `/lock`, `/unlock`, `/hide`, `/show`, `/slowmode`, `/slowoff`, `/role`, `/nick`, `/nickname`, `/setnick`, `/moveall`, `/voicekick`, `/voicemute`, `/voiceunmute`, `/deafen`, `/undeafen`, `/banlist`, `/announce`, `/dm`

### Информация
`/userinfo`, `/whois`, `/serverinfo`, `/channelinfo`, `/roleinfo`, `/roles`, `/members`, `/invites`, `/boosters`, `/emojis`, `/stats`, `/gamestats`, `/uptime`, `/servertime`

### Утилиты
`/avatar`, `/banner`, `/servericon`, `/serverbanner`, `/firstmessage`, `/poll`, `/reminder`, `/translate`, `/weather`, `/qr`, `/timestamp`

### Финансы
`/currency`, `/crypto`, `/convert`

### Развлечения
`/8ball`, `/coinflip`, `/roll`, `/random`, `/choose`

### Текст и кодирование
`/math`, `/base64`, `/reverse`, `/jumbo`, `/color`, `/password`, `/hash`, `/say`, `/embed`, `/stealemoji`

### Прочее
`/ping`, `/help`

## Лицензия

MIT
