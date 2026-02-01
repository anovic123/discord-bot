import { Client, GatewayIntentBits, TextChannel, REST, Routes, EmbedBuilder, ActivityType, Presence } from 'discord.js';
import cron from 'node-cron';
import { Config } from '../../config';
import { GetRatesUseCase } from '../../application/get-rates.use-case';
import { GetCryptoUseCase } from '../../application/get-crypto.use-case';
import { ConvertUseCase } from '../../application/convert.use-case';
import { currencyCommand, handleCurrencyCommand } from './commands/currency';
import { cryptoCommand, handleCryptoCommand } from './commands/crypto';
import { convertCommand, handleConvertCommand } from './commands/convert';
import { serverInfoCommand, handleServerInfoCommand } from './commands/serverinfo';
import { userInfoCommand, handleUserInfoCommand } from './commands/userinfo';
import { avatarCommand, handleAvatarCommand } from './commands/avatar';
import { pingCommand, handlePingCommand } from './commands/ping';
import { clearCommand, handleClearCommand } from './commands/clear';
import { pollCommand, handlePollCommand } from './commands/poll';
import { timeoutCommand, handleTimeoutCommand } from './commands/timeout';
import { kickCommand, handleKickCommand } from './commands/kick';
import { banCommand, handleBanCommand } from './commands/ban';
import { slowmodeCommand, handleSlowmodeCommand } from './commands/slowmode';
import { helpCommand, handleHelpCommand } from './commands/help';
import { unbanCommand, handleUnbanCommand } from './commands/unban';
import { untimeoutCommand, handleUntimeoutCommand } from './commands/untimeout';
import { lockCommand, handleLockCommand } from './commands/lock';
import { unlockCommand, handleUnlockCommand } from './commands/unlock';
import { nickCommand, handleNickCommand } from './commands/nick';
import { roleCommand, handleRoleCommand } from './commands/role';
import { warnCommand, handleWarnCommand } from './commands/warn';
import { announceCommand, handleAnnounceCommand } from './commands/announce';
import { purgeCommand, handlePurgeCommand } from './commands/purge';
import { moveallCommand, handleMoveallCommand } from './commands/moveall';
import { slowoffCommand, handleSlowoffCommand } from './commands/slowoff';
import { roleinfoCommand, handleRoleinfoCommand } from './commands/roleinfo';
import { banlistCommand, handleBanlistCommand } from './commands/banlist';
import { hideCommand, handleHideCommand } from './commands/hide';
import { showCommand, handleShowCommand } from './commands/show';
import { channelinfoCommand, handleChannelinfoCommand } from './commands/channelinfo';
import { emojisCommand, handleEmojisCommand } from './commands/emojis';
import { stealemojiCommand, handleStealemojiCommand } from './commands/stealemoji';
import { setnickCommand, handleSetnickCommand } from './commands/setnick';
import { embedCommand, handleEmbedCommand } from './commands/embed';
import { rolesCommand, handleRolesCommand } from './commands/roles';
import { invitesCommand, handleInvitesCommand } from './commands/invites';
import { membersCommand, handleMembersCommand } from './commands/members';
import { boostersCommand, handleBoostersCommand } from './commands/boosters';
import { bannerCommand, handleBannerCommand } from './commands/banner';
import { sayCommand, handleSayCommand } from './commands/say';
import { dmCommand, handleDmCommand } from './commands/dm';
import { voicekickCommand, handleVoicekickCommand } from './commands/voicekick';
import { voicemuteCommand, handleVoicemuteCommand } from './commands/voicemute';
import { voiceunmuteCommand, handleVoiceunmuteCommand } from './commands/voiceunmute';
import { deafenCommand, handleDeafenCommand } from './commands/deafen';
import { undeafenCommand, handleUndeafenCommand } from './commands/undeafen';
import { firstmessageCommand, handleFirstmessageCommand } from './commands/firstmessage';
import { colorCommand, handleColorCommand } from './commands/color';
import { mathCommand, handleMathCommand } from './commands/math';
import { base64Command, handleBase64Command } from './commands/base64';
import { reverseCommand, handleReverseCommand } from './commands/reverse';
import { jumboCommand, handleJumboCommand } from './commands/jumbo';
import { whoisCommand, handleWhoisCommand } from './commands/whois';
import { serverbannerCommand, handleServerbannerCommand } from './commands/serverbanner';
import { servericonCommand, handleServericonCommand } from './commands/servericon';
import { nicknameCommand, handleNicknameCommand } from './commands/nickname';
import { randomCommand, handleRandomCommand } from './commands/random';
import { coinflipCommand, handleCoinflipCommand } from './commands/coinflip';
import { eightballCommand, handleEightballCommand } from './commands/8ball';
import { reminderCommand, handleReminderCommand } from './commands/reminder';
import { uptimeCommand, handleUptimeCommand } from './commands/uptime';
import { statsCommand, handleStatsCommand } from './commands/stats';
import { servertimeCommand, handleServertimeCommand } from './commands/servertime';
import { rollCommand, handleRollCommand } from './commands/roll';
import { chooseCommand, handleChooseCommand } from './commands/choose';
import { weatherCommand, handleWeatherCommand } from './commands/weather';
import { passwordCommand, handlePasswordCommand } from './commands/password';
import { timestampCommand, handleTimestampCommand } from './commands/timestamp';
import { qrCommand, handleQrCommand } from './commands/qr';
import { hashCommand, handleHashCommand } from './commands/hash';
import { translateCommand, handleTranslateCommand } from './commands/translate';
import { statsTracker } from './utils/stats-tracker';
import { GameActivityUseCase } from '../../application/game-activity.use-case';
import { gamestatsCommand, handleGamestatsCommand } from './commands/gamestats';

interface UseCases {
  getRates: GetRatesUseCase;
  getCrypto: GetCryptoUseCase;
  convert: ConvertUseCase;
  gameActivity: GameActivityUseCase;
}

export class DiscordBot {
  private client: Client;

  constructor(
    private readonly config: Config,
    private readonly useCases: UseCases
  ) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
      ],
    });

    this.setupEventHandlers();
  }

  async start(): Promise<void> {
    await this.client.login(this.config.discordToken);
  }

  stop(): void {
    this.useCases.gameActivity.forceSave();
    this.client.destroy();
  }

  private setupEventHandlers(): void {
    this.client.once('ready', async () => {
      console.log(`Bot started as ${this.client.user?.tag}`);
      await this.registerCommands();
      this.startCronJob();
      await this.sendStartupMessage();
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      statsTracker.trackCommand(interaction.commandName);

      try {
      switch (interaction.commandName) {
        case 'currency':
          await handleCurrencyCommand(interaction, this.useCases.getRates);
          break;
        case 'crypto':
          await handleCryptoCommand(interaction, this.useCases.getCrypto);
          break;
        case 'convert':
          await handleConvertCommand(interaction, this.useCases.convert);
          break;
        case 'serverinfo':
          await handleServerInfoCommand(interaction);
          break;
        case 'userinfo':
          await handleUserInfoCommand(interaction);
          break;
        case 'avatar':
          await handleAvatarCommand(interaction);
          break;
        case 'ping':
          await handlePingCommand(interaction);
          break;
        case 'clear':
          await handleClearCommand(interaction);
          break;
        case 'poll':
          await handlePollCommand(interaction);
          break;
                case 'timeout':
          await handleTimeoutCommand(interaction);
          break;
        case 'kick':
          await handleKickCommand(interaction);
          break;
        case 'ban':
          await handleBanCommand(interaction);
          break;
        case 'slowmode':
          await handleSlowmodeCommand(interaction);
          break;
        case 'help':
          await handleHelpCommand(interaction);
          break;
        case 'unban':
          await handleUnbanCommand(interaction);
          break;
        case 'untimeout':
          await handleUntimeoutCommand(interaction);
          break;
        case 'lock':
          await handleLockCommand(interaction);
          break;
        case 'unlock':
          await handleUnlockCommand(interaction);
          break;
        case 'nick':
          await handleNickCommand(interaction);
          break;
        case 'role':
          await handleRoleCommand(interaction);
          break;
        case 'warn':
          await handleWarnCommand(interaction);
          break;
        case 'announce':
          await handleAnnounceCommand(interaction);
          break;
        case 'purge':
          await handlePurgeCommand(interaction);
          break;
        case 'moveall':
          await handleMoveallCommand(interaction);
          break;
        case 'slowoff':
          await handleSlowoffCommand(interaction);
          break;
        case 'roleinfo':
          await handleRoleinfoCommand(interaction);
          break;
        case 'banlist':
          await handleBanlistCommand(interaction);
          break;
        case 'hide':
          await handleHideCommand(interaction);
          break;
        case 'show':
          await handleShowCommand(interaction);
          break;
        case 'channelinfo':
          await handleChannelinfoCommand(interaction);
          break;
        case 'emojis':
          await handleEmojisCommand(interaction);
          break;
        case 'stealemoji':
          await handleStealemojiCommand(interaction);
          break;
        case 'setnick':
          await handleSetnickCommand(interaction);
          break;
        case 'embed':
          await handleEmbedCommand(interaction);
          break;
        case 'roles':
          await handleRolesCommand(interaction);
          break;
        case 'invites':
          await handleInvitesCommand(interaction);
          break;
        case 'members':
          await handleMembersCommand(interaction);
          break;
        case 'boosters':
          await handleBoostersCommand(interaction);
          break;
        case 'banner':
          await handleBannerCommand(interaction);
          break;
        case 'say':
          await handleSayCommand(interaction);
          break;
        case 'dm':
          await handleDmCommand(interaction);
          break;
        case 'voicekick':
          await handleVoicekickCommand(interaction);
          break;
        case 'voicemute':
          await handleVoicemuteCommand(interaction);
          break;
        case 'voiceunmute':
          await handleVoiceunmuteCommand(interaction);
          break;
        case 'deafen':
          await handleDeafenCommand(interaction);
          break;
        case 'undeafen':
          await handleUndeafenCommand(interaction);
          break;
        case 'firstmessage':
          await handleFirstmessageCommand(interaction);
          break;
        case 'color':
          await handleColorCommand(interaction);
          break;
        case 'math':
          await handleMathCommand(interaction);
          break;
        case 'base64':
          await handleBase64Command(interaction);
          break;
        case 'reverse':
          await handleReverseCommand(interaction);
          break;
        case 'jumbo':
          await handleJumboCommand(interaction);
          break;
        case 'whois':
          await handleWhoisCommand(interaction);
          break;
        case 'serverbanner':
          await handleServerbannerCommand(interaction);
          break;
        case 'servericon':
          await handleServericonCommand(interaction);
          break;
        case 'nickname':
          await handleNicknameCommand(interaction);
          break;
        case 'random':
          await handleRandomCommand(interaction);
          break;
        case 'coinflip':
          await handleCoinflipCommand(interaction);
          break;
        case '8ball':
          await handleEightballCommand(interaction);
          break;
        case 'reminder':
          await handleReminderCommand(interaction);
          break;
        case 'uptime':
          await handleUptimeCommand(interaction);
          break;
        case 'stats':
          await handleStatsCommand(interaction);
          break;
        case 'servertime':
          await handleServertimeCommand(interaction);
          break;
        case 'roll':
          await handleRollCommand(interaction);
          break;
        case 'choose':
          await handleChooseCommand(interaction);
          break;
        case 'weather':
          await handleWeatherCommand(interaction);
          break;
        case 'password':
          await handlePasswordCommand(interaction);
          break;
        case 'timestamp':
          await handleTimestampCommand(interaction);
          break;
        case 'qr':
          await handleQrCommand(interaction);
          break;
        case 'hash':
          await handleHashCommand(interaction);
          break;
        case 'translate':
          await handleTranslateCommand(interaction);
          break;
        case 'gamestats':
          await handleGamestatsCommand(interaction, this.useCases.gameActivity);
          break;
      }
      } catch (error) {
        statsTracker.trackError();
        console.error(`Command error [${interaction.commandName}]:`, error);
      }
    });

    this.client.on('presenceUpdate', (oldPresence, newPresence) => {
      this.handlePresenceUpdate(oldPresence, newPresence);
    });
  }

  private handlePresenceUpdate(oldPresence: Presence | null, newPresence: Presence): void {
    const userId = newPresence.userId;

    const oldGames = this.getGameActivities(oldPresence);
    const newGames = this.getGameActivities(newPresence);

    for (const gameName of oldGames) {
      if (!newGames.has(gameName)) {
        this.useCases.gameActivity.endSession(userId, gameName);
      }
    }

    for (const gameName of newGames) {
      if (!oldGames.has(gameName)) {
        this.useCases.gameActivity.startSession(userId, gameName);
      }
    }
  }

  private getGameActivities(presence: Presence | null): Set<string> {
    const games = new Set<string>();

    if (!presence?.activities) return games;

    for (const activity of presence.activities) {
      if (activity.type === ActivityType.Playing && activity.name) {
        games.add(activity.name);
      }
    }

    return games;
  }

  private async registerCommands(): Promise<void> {
    const rest = new REST({ version: '10' }).setToken(this.config.discordToken);

    const commands = [
      currencyCommand.toJSON(),
      cryptoCommand.toJSON(),
      convertCommand.toJSON(),
      serverInfoCommand.toJSON(),
      userInfoCommand.toJSON(),
      avatarCommand.toJSON(),
      pingCommand.toJSON(),
      clearCommand.toJSON(),
      pollCommand.toJSON(),
            timeoutCommand.toJSON(),
      kickCommand.toJSON(),
      banCommand.toJSON(),
      slowmodeCommand.toJSON(),
      helpCommand.toJSON(),
      unbanCommand.toJSON(),
      untimeoutCommand.toJSON(),
      lockCommand.toJSON(),
      unlockCommand.toJSON(),
      nickCommand.toJSON(),
      roleCommand.toJSON(),
      warnCommand.toJSON(),
      announceCommand.toJSON(),
      purgeCommand.toJSON(),
      moveallCommand.toJSON(),
      slowoffCommand.toJSON(),
      roleinfoCommand.toJSON(),
      banlistCommand.toJSON(),
      hideCommand.toJSON(),
      showCommand.toJSON(),
      channelinfoCommand.toJSON(),
      emojisCommand.toJSON(),
      stealemojiCommand.toJSON(),
      setnickCommand.toJSON(),
      embedCommand.toJSON(),
      rolesCommand.toJSON(),
      invitesCommand.toJSON(),
      membersCommand.toJSON(),
      boostersCommand.toJSON(),
      bannerCommand.toJSON(),
      sayCommand.toJSON(),
      dmCommand.toJSON(),
      voicekickCommand.toJSON(),
      voicemuteCommand.toJSON(),
      voiceunmuteCommand.toJSON(),
      deafenCommand.toJSON(),
      undeafenCommand.toJSON(),
      firstmessageCommand.toJSON(),
      colorCommand.toJSON(),
      mathCommand.toJSON(),
      base64Command.toJSON(),
      reverseCommand.toJSON(),
      jumboCommand.toJSON(),
      whoisCommand.toJSON(),
      serverbannerCommand.toJSON(),
      servericonCommand.toJSON(),
      nicknameCommand.toJSON(),
      randomCommand.toJSON(),
      coinflipCommand.toJSON(),
      eightballCommand.toJSON(),
      reminderCommand.toJSON(),
      uptimeCommand.toJSON(),
      statsCommand.toJSON(),
      servertimeCommand.toJSON(),
      rollCommand.toJSON(),
      chooseCommand.toJSON(),
      weatherCommand.toJSON(),
      passwordCommand.toJSON(),
      timestampCommand.toJSON(),
      qrCommand.toJSON(),
      hashCommand.toJSON(),
      translateCommand.toJSON(),
      gamestatsCommand.toJSON(),
    ];

    try {
      await rest.put(
        Routes.applicationGuildCommands(this.client.user!.id, this.config.guildId),
        { body: commands }
      );
      console.log('Slash commands registered');
    } catch (error) {
      console.error('Failed to register commands:', error);
    }
  }

  private startCronJob(): void {
    cron.schedule(this.config.cronTime, () => this.sendDailyRates(), {
      timezone: this.config.timezone,
    });
    console.log(`Cron job started: ${this.config.cronTime} (${this.config.timezone})`);
  }

  private async sendDailyRates(): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(this.config.channelId);

      if (!channel || !(channel instanceof TextChannel)) {
        console.error('Channel not found or not a text channel');
        return;
      }

      const [currencyMessage, cryptoMessage] = await Promise.all([
        this.useCases.getRates.executeWithGreeting(),
        this.useCases.getCrypto.execute(),
      ]);

      await channel.send(currencyMessage);
      await channel.send(cryptoMessage);

      console.log(`Daily rates sent at ${new Date().toLocaleTimeString('uk-UA')}`);
    } catch (error) {
      console.error('Failed to send daily rates:', error);
    }
  }

  private async sendStartupMessage(): Promise<void> {
    if (!this.config.welcomeChannelId) {
      console.log('Startup message skipped: WELCOME_CHANNEL_ID not set');
      return;
    }

    try {
      let channel;
      try {
        channel = await this.client.channels.fetch(this.config.welcomeChannelId);
      } catch {
        console.warn(`Startup message skipped: channel ${this.config.welcomeChannelId} not accessible`);
        return;
      }

      if (!channel || !(channel instanceof TextChannel)) {
        console.warn('Startup message skipped: channel is not a text channel');
        return;
      }

      const guild = this.client.guilds.cache.get(this.config.guildId);
      const totalCommands = 64;

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🟢 Бот онлайн!')
        .setDescription(`**${this.client.user?.username}** успешно запущен и готов к работе!`)
        .setThumbnail(this.client.user?.displayAvatarURL() || null)
        .addFields(
          { name: '🏠 Сервер', value: guild?.name || 'Неизвестно', inline: true },
          { name: '👥 Участников', value: `${guild?.memberCount || 0}`, inline: true },
          { name: '⚡ Команд', value: `${totalCommands}`, inline: true },
          { name: '🏓 Пинг', value: `${this.client.ws.ping}ms`, inline: true },
          { name: '📅 Время', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setFooter({ text: 'Используйте /help для списка команд' })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      console.log('Startup message sent');
    } catch (error) {
      console.error('Failed to send startup message:', error);
    }
  }
}
