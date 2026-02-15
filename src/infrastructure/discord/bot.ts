import {
  Client,
  GatewayIntentBits,
  TextChannel,
  REST,
  Routes,
  EmbedBuilder,
  type ModalSubmitInteraction,
  type GuildMember,
} from 'discord.js';
import cron from 'node-cron';
import { Config } from '../../config';
import { createLogger } from '../logger';
import { cooldownManager } from '../cooldown';
import { auditLogger } from '../audit';
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
import { tempbanCommand, handleTempbanCommand } from './commands/tempban';
import { summaryCommand, handleSummaryCommand } from './commands/summary';
import { aiSummaryCommand, handleAiSummaryCommand } from './commands/ai-summary';
import { askCommand, handleAskCommand } from './commands/ask';
import { roastCommand, handleRoastCommand } from './commands/roast';
import {
  settingsCommand,
  handleSettingsCommand,
  handleSettingsButton,
  handleSettingsSelectMenu,
  handleSettingsChannelSelect,
} from './commands/settings';
import {
  welcomeMessageCommand,
  handleWelcomeMessageCommand,
  handleWelcomeMessageButton,
  handleWelcomeMessageModal,
  buildWelcomeEmbed,
} from './commands/welcome-message';
import {
  toxicModeCommand,
  handleToxicModeCommand,
  handleToxicModeButton,
} from './commands/toxic-mode';
import { guildSettings } from '../settings';
import { statsTracker } from './utils/stats-tracker';
import { setServerStatsProvider } from '../health';
import { toxicModeManager } from './utils/toxic-mode-manager';

interface UseCases {
  getRates: GetRatesUseCase;
  getCrypto: GetCryptoUseCase;
  convert: ConvertUseCase;
}

const logger = createLogger('Bot');

const MODERATION_COMMANDS = new Set([
  'ban',
  'tempban',
  'unban',
  'kick',
  'timeout',
  'untimeout',
  'warn',
  'purge',
  'clear',
  'lock',
  'unlock',
  'hide',
  'show',
  'slowmode',
  'slowoff',
  'nick',
  'nickname',
  'setnick',
  'role',
  'voicekick',
  'voicemute',
  'voiceunmute',
  'deafen',
  'undeafen',
  'moveall',
]);

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
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.setupEventHandlers();
  }

  async start(): Promise<void> {
    await this.client.login(this.config.discordToken);
  }

  stop(): void {
    this.client.destroy();
  }

  private setupEventHandlers(): void {
    this.client.once('ready', async () => {
      logger.info(`Bot started as ${this.client.user?.tag}`);
      await this.registerCommands();
      this.startCronJob();
      setServerStatsProvider(() => this.getServerStats());
      toxicModeManager.init(this.client);
      await toxicModeManager.restoreTimers();
      await this.sendStartupMessage();
    });

    this.client.on('guildMemberAdd', (member) => this.handleMemberJoin(member));

    this.client.on('guildMemberRemove', (member) => {
      const settings = guildSettings.getSettings(member.guild.id);
      if (!settings.logging.channelId || !settings.logging.memberJoinLeave) return;
      this.sendLogEmbed(
        settings.logging.channelId,
        new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle('👋 Участник покинул сервер')
          .setDescription(`**${member.user?.tag || 'Неизвестный'}** (${member.id})`)
          .setThumbnail(member.displayAvatarURL())
          .setTimestamp()
      );
    });

    this.client.on('messageDelete', (message) => {
      if (!message.guildId || message.author?.bot) return;
      const settings = guildSettings.getSettings(message.guildId);
      if (!settings.logging.channelId || !settings.logging.messageDelete) return;
      this.sendLogEmbed(
        settings.logging.channelId,
        new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle('🗑️ Сообщение удалено')
          .addFields(
            { name: 'Автор', value: message.author?.tag || 'Неизвестный', inline: true },
            { name: 'Канал', value: `<#${message.channelId}>`, inline: true },
            {
              name: 'Содержимое',
              value: message.content?.slice(0, 1024) || '*Нет текста / не кешировано*',
            }
          )
          .setTimestamp()
      );
    });

    this.client.on('messageUpdate', (oldMessage, newMessage) => {
      if (!newMessage.guildId || newMessage.author?.bot) return;
      if (oldMessage.content === newMessage.content) return;
      const settings = guildSettings.getSettings(newMessage.guildId);
      if (!settings.logging.channelId || !settings.logging.messageEdit) return;
      this.sendLogEmbed(
        settings.logging.channelId,
        new EmbedBuilder()
          .setColor(0xffaa00)
          .setTitle('✏️ Сообщение отредактировано')
          .addFields(
            { name: 'Автор', value: newMessage.author?.tag || 'Неизвестный', inline: true },
            { name: 'Канал', value: `<#${newMessage.channelId}>`, inline: true },
            { name: 'Было', value: oldMessage.content?.slice(0, 512) || '*Не кешировано*' },
            { name: 'Стало', value: newMessage.content?.slice(0, 512) || '*Пусто*' }
          )
          .setTimestamp()
      );
    });

    this.client.on('guildMemberUpdate', (oldMember, newMember) => {
      if (oldMember.nickname === newMember.nickname) return;
      const settings = guildSettings.getSettings(newMember.guild.id);
      if (!settings.logging.channelId || !settings.logging.nicknameChanges) return;
      this.sendLogEmbed(
        settings.logging.channelId,
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('📛 Смена никнейма')
          .addFields(
            { name: 'Участник', value: newMember.user.tag, inline: true },
            { name: 'Было', value: oldMember.nickname || '*Без никнейма*', inline: true },
            { name: 'Стало', value: newMember.nickname || '*Без никнейма*', inline: true }
          )
          .setTimestamp()
      );
    });

    this.client.on('voiceStateUpdate', (oldState, newState) => {
      const guildId = newState.guild.id;
      const settings = guildSettings.getSettings(guildId);
      if (!settings.logging.channelId || !settings.logging.voiceActivity) return;

      const member = newState.member;
      if (!member || member.user.bot) return;

      let title: string;
      let description: string;
      let color: number;

      if (!oldState.channelId && newState.channelId) {
        title = '🔊 Подключился к голосовому';
        description = `**${member.user.tag}** зашёл в <#${newState.channelId}>`;
        color = 0x57f287;
      } else if (oldState.channelId && !newState.channelId) {
        title = '🔇 Отключился от голосового';
        description = `**${member.user.tag}** вышел из <#${oldState.channelId}>`;
        color = 0xff4444;
      } else if (
        oldState.channelId &&
        newState.channelId &&
        oldState.channelId !== newState.channelId
      ) {
        title = '🔀 Переместился между каналами';
        description = `**${member.user.tag}**: <#${oldState.channelId}> → <#${newState.channelId}>`;
        color = 0xffaa00;
      } else {
        return;
      }

      this.sendLogEmbed(
        settings.logging.channelId,
        new EmbedBuilder()
          .setColor(color)
          .setTitle(title)
          .setDescription(description)
          .setTimestamp()
      );
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (interaction.isButton() && interaction.customId.startsWith('settings_')) {
        try {
          await handleSettingsButton(interaction);
        } catch (error) {
          logger.error('Settings button error', error);
        }
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('welcome_')) {
        try {
          await handleWelcomeMessageButton(interaction);
        } catch (error) {
          logger.error('Welcome message button error', error);
        }
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('toxic_')) {
        try {
          await handleToxicModeButton(interaction);
        } catch (error) {
          logger.error('Toxic mode button error', error);
        }
        return;
      }

      if (interaction.isModalSubmit() && interaction.customId === 'welcome_modal') {
        try {
          await handleWelcomeMessageModal(interaction as ModalSubmitInteraction);
        } catch (error) {
          logger.error('Welcome message modal error', error);
        }
        return;
      }

      if (interaction.isStringSelectMenu() && interaction.customId === 'settings_category') {
        try {
          await handleSettingsSelectMenu(interaction);
        } catch (error) {
          logger.error('Settings select menu error', error);
        }
        return;
      }

      if (
        interaction.isChannelSelectMenu() &&
        interaction.customId.startsWith('settings_channel_')
      ) {
        try {
          await handleSettingsChannelSelect(interaction);
        } catch (error) {
          logger.error('Settings channel select error', error);
        }
        return;
      }

      if (!interaction.isChatInputCommand()) return;

      const cooldownCheck = cooldownManager.check(interaction.user.id, interaction.commandName);
      if (!cooldownCheck.allowed) {
        const seconds = Math.ceil((cooldownCheck.remainingMs || 0) / 1000);
        await interaction.reply({
          content: `⏳ Подождите ${seconds} сек. перед повторным использованием команды.`,
          ephemeral: true,
        });
        return;
      }

      statsTracker.trackCommand(interaction.commandName, interaction.user.id);

      if (MODERATION_COMMANDS.has(interaction.commandName)) {
        const guildId = interaction.guildId || '';
        const modSettings = guildSettings.getSettings(guildId);
        if (modSettings.moderation.auditLog) {
          const targetUser = interaction.options.getUser('user');
          auditLogger.log({
            action: interaction.commandName,
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.tag,
            targetId: targetUser?.id,
            targetTag: targetUser?.tag,
            guildId,
            channelId: interaction.channelId,
            reason: interaction.options.getString('reason') || undefined,
          });
        }
      }

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
          case 'tempban':
            await handleTempbanCommand(interaction);
            break;
          case 'summary':
            await handleSummaryCommand(interaction);
            break;
          case 'ai-summary':
            await handleAiSummaryCommand(interaction);
            break;
          case 'ask':
            await handleAskCommand(interaction);
            break;
          case 'roast':
            await handleRoastCommand(interaction);
            break;
          case 'settings':
            await handleSettingsCommand(interaction);
            break;
          case 'welcome-message':
            await handleWelcomeMessageCommand(interaction);
            break;
          case 'toxic-mode':
            await handleToxicModeCommand(interaction);
            break;
        }
      } catch (error) {
        statsTracker.trackError();
        logger.error(`Command error [${interaction.commandName}]`, error);
      }
    });
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
      tempbanCommand.toJSON(),
      summaryCommand.toJSON(),
      aiSummaryCommand.toJSON(),
      askCommand.toJSON(),
      roastCommand.toJSON(),
      settingsCommand.toJSON(),
      welcomeMessageCommand.toJSON(),
      toxicModeCommand.toJSON(),
    ];

    try {
      await rest.put(Routes.applicationGuildCommands(this.client.user!.id, this.config.guildId), {
        body: commands,
      });
      logger.info('Slash commands registered');
    } catch (error) {
      logger.error('Failed to register commands', error);
    }
  }

  private startCronJob(): void {
    cron.schedule(this.config.cronTime, () => this.sendDailyRates(), {
      timezone: this.config.timezone,
    });
    logger.info(`Cron job started: ${this.config.cronTime} (${this.config.timezone})`);
  }

  private async sendDailyRates(): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(this.config.channelId);

      if (!channel || !(channel instanceof TextChannel)) {
        logger.error('Channel not found or not a text channel');
        return;
      }

      const settings = guildSettings.getSettings(this.config.guildId);

      const [currencyMessage, cryptoMessage] = await Promise.all([
        settings.dailyReport.currencyRates ? this.useCases.getRates.executeWithGreeting() : null,
        settings.dailyReport.cryptoRates ? this.useCases.getCrypto.execute() : null,
      ]);

      if (currencyMessage) await channel.send(currencyMessage);
      if (cryptoMessage) await channel.send(cryptoMessage);

      if (settings.dailyReport.serverStats) {
        await this.sendDailyStatsReport(channel);
      }

      logger.info(`Daily rates sent at ${new Date().toLocaleTimeString('uk-UA')}`);
    } catch (error) {
      logger.error('Failed to send daily rates', error);
    }
  }

  private async sendDailyStatsReport(channel: TextChannel): Promise<void> {
    try {
      const guild = this.client.guilds.cache.get(this.config.guildId);

      if (!guild) {
        logger.warn('Daily stats report skipped: guild not found');
        return;
      }

      const onlineMembers = guild.members.cache.filter(
        (m) => m.presence?.status && m.presence.status !== 'offline'
      ).size;

      const voiceMembers = guild.voiceStates.cache.filter((vs) => vs.channelId !== null).size;

      const textChannels = guild.channels.cache.filter((c) => c.isTextBased()).size;
      const voiceChannels = guild.channels.cache.filter((c) => c.isVoiceBased()).size;

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📊 Ежедневный отчёт')
        .setDescription(`Состояние сервера **${guild.name}**`)
        .addFields(
          {
            name: '👥 Участники',
            value: [
              `**Всего:** ${guild.memberCount}`,
              `**Онлайн:** ${onlineMembers}`,
              `**В голосовых:** ${voiceMembers}`,
            ].join('\n'),
            inline: true,
          },
          {
            name: '💬 Каналы',
            value: [
              `**Текстовых:** ${textChannels}`,
              `**Голосовых:** ${voiceChannels}`,
              `**Всего:** ${guild.channels.cache.size}`,
            ].join('\n'),
            inline: true,
          },
          {
            name: '🔧 Сервер',
            value: [
              `**Бусты:** ${guild.premiumSubscriptionCount || 0} (уровень ${guild.premiumTier})`,
              `**Ролей:** ${guild.roles.cache.size}`,
              `**Эмодзи:** ${guild.emojis.cache.size}`,
            ].join('\n'),
            inline: true,
          }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (error) {
      logger.error('Failed to send daily stats report', error);
    }
  }

  private async sendStartupMessage(): Promise<void> {
    if (!this.config.welcomeChannelId) {
      logger.debug('Startup message skipped: WELCOME_CHANNEL_ID not set');
      return;
    }

    const settings = guildSettings.getSettings(this.config.guildId);
    if (!settings.welcome.startupMessage) {
      logger.debug('Startup message skipped: disabled in settings');
      return;
    }

    try {
      let channel;
      try {
        channel = await this.client.channels.fetch(this.config.welcomeChannelId);
      } catch {
        logger.warn(
          `Startup message skipped: channel ${this.config.welcomeChannelId} not accessible`
        );
        return;
      }

      if (!channel || !(channel instanceof TextChannel)) {
        logger.warn('Startup message skipped: channel is not a text channel');
        return;
      }

      const guild = this.client.guilds.cache.get(this.config.guildId);
      const totalCommands = 70;

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
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
      logger.info('Startup message sent');
    } catch (error) {
      logger.error('Failed to send startup message', error);
    }
  }

  private async handleMemberJoin(member: GuildMember): Promise<void> {
    const settings = guildSettings.getSettings(member.guild.id);

    if (settings.logging.channelId && settings.logging.memberJoinLeave) {
      this.sendLogEmbed(
        settings.logging.channelId,
        new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle('📥 Новый участник')
          .setDescription(`**${member.user.tag}** (${member.id}) присоединился к серверу`)
          .setThumbnail(member.displayAvatarURL())
          .setTimestamp()
      );
    }

    if (!this.config.welcomeChannelId) return;
    if (!settings.welcome.welcomeMessage || !settings.welcomeMessage.enabled) return;

    try {
      let channel;
      try {
        channel = await this.client.channels.fetch(this.config.welcomeChannelId);
      } catch {
        logger.warn(
          `Welcome message skipped: channel ${this.config.welcomeChannelId} not accessible`
        );
        return;
      }

      if (!channel || !(channel instanceof TextChannel)) {
        logger.warn('Welcome message skipped: channel is not a text channel');
        return;
      }

      const embed = buildWelcomeEmbed(settings.welcomeMessage, {
        userId: member.id,
        username: member.displayName,
        server: member.guild.name,
        memberCount: member.guild.memberCount,
        avatar: member.displayAvatarURL({ size: 256 }),
        createdTimestamp: Math.floor(member.user.createdTimestamp / 1000),
      });

      await channel.send({ embeds: [embed] });
      logger.info(`Welcome message sent for ${member.user.tag}`);
    } catch (error) {
      logger.error('Failed to send welcome message', error);
    }
  }

  private sendLogEmbed(channelId: string, embed: EmbedBuilder): void {
    this.client.channels
      .fetch(channelId)
      .then((channel) => {
        if (channel instanceof TextChannel) {
          channel
            .send({ embeds: [embed] })
            .catch((err) => logger.error('Failed to send log embed', err));
        }
      })
      .catch((err) => logger.error('Failed to fetch log channel', err));
  }

  private getServerStats(): object {
    const guild = this.client.guilds.cache.get(this.config.guildId);

    if (!guild) {
      return { error: 'Guild not found' };
    }

    const onlineMembers = guild.members.cache.filter(
      (m) => m.presence?.status && m.presence.status !== 'offline'
    ).size;

    const voiceMembers = guild.voiceStates.cache.filter((vs) => vs.channelId !== null).size;

    const textChannels = guild.channels.cache.filter((c) => c.isTextBased()).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.isVoiceBased()).size;

    return {
      guild: {
        name: guild.name,
        id: guild.id,
        memberCount: guild.memberCount,
        onlineMembers,
        voiceMembers,
      },
      channels: {
        text: textChannels,
        voice: voiceChannels,
        total: guild.channels.cache.size,
      },
      boosts: {
        count: guild.premiumSubscriptionCount || 0,
        tier: guild.premiumTier,
      },
      roles: guild.roles.cache.size,
      emojis: guild.emojis.cache.size,
      createdAt: guild.createdAt.toISOString(),
      timestamp: new Date().toISOString(),
    };
  }
}
