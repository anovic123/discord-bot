import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} from 'discord.js';
import { guildSettings, type GuildSettings } from '../../settings';
import { requireAdmin } from '../utils/permissions';

export const settingsCommand = new SlashCommandBuilder()
  .setName('settings')
  .setDescription('Управление настройками бота')
  .addStringOption((option) =>
    option.setName('search').setDescription('Поиск по настройкам').setRequired(false)
  );

const CATEGORY_LABELS: Record<string, string> = {
  dailyReport: '📊 Ежедневный отчёт',
  welcome: '👋 Приветствие',
  moderation: '🛡️ Модерация',
  ai: '🤖 AI',
  logging: '📝 Логирование',
};

const SETTING_LABELS: Record<string, Record<string, string>> = {
  dailyReport: {
    currencyRates: '💰 Курсы валют',
    cryptoRates: '🪙 Курсы крипто',
    serverStats: '📈 Статистика сервера',
  },
  welcome: {
    startupMessage: '🟢 Сообщение при запуске',
    welcomeMessage: '👋 Приветствие новых участников',
  },
  moderation: {
    auditLog: '📋 Аудит лог',
  },
  ai: {
    askEnabled: '💬 Команда /ask',
    roastEnabled: '🔥 Команда /roast',
    aiSummaryEnabled: '📝 Команда /ai-summary',
    maxRequestsPerDay: '📊 Лимит запросов/день',
    cooldownSeconds: '⏱️ Кулдаун (сек)',
    temperature: '🌡️ Температура модели',
  },
  logging: {
    channelId: '📝 Канал для логов',
    messageDelete: '🗑️ Удаление сообщений',
    messageEdit: '✏️ Редактирование сообщений',
    memberJoinLeave: '👥 Вход/выход участников',
    nicknameChanges: '📛 Смена никнеймов',
    voiceActivity: '🔊 Голосовая активность',
  },
};

type SettingsCategory = 'dailyReport' | 'welcome' | 'moderation' | 'ai' | 'logging';

const NUMERIC_SETTINGS: Record<string, { step: number; min: number; max: number }> = {
  'ai.maxRequestsPerDay': { step: 10, min: 10, max: 200 },
  'ai.cooldownSeconds': { step: 5, min: 0, max: 60 },
  'ai.temperature': { step: 0.1, min: 0.1, max: 1.5 },
};

function isNumericSetting(category: string, key: string): boolean {
  return `${category}.${key}` in NUMERIC_SETTINGS;
}

function isChannelSetting(category: string, key: string): boolean {
  return category === 'logging' && key === 'channelId';
}

function statusIcon(enabled: boolean): string {
  return enabled ? '🟢' : '🔴';
}

function getCategoryData(settings: GuildSettings, category: string): Record<string, unknown> {
  return settings[category as SettingsCategory] as unknown as Record<string, unknown>;
}

function formatSettingValue(category: string, key: string, value: unknown): string {
  if (isChannelSetting(category, key)) {
    return value ? `<#${value}>` : '❌ Не задан';
  }
  if (isNumericSetting(category, key)) {
    return `**${value}**`;
  }
  return statusIcon(value as boolean);
}

function buildOverviewEmbed(settings: GuildSettings, search?: string): EmbedBuilder {
  const lines: string[] = [];
  const query = search?.toLowerCase();

  for (const [category, keys] of Object.entries(SETTING_LABELS)) {
    const categoryData = getCategoryData(settings, category);
    const matchedLines: string[] = [];

    for (const [key, label] of Object.entries(keys)) {
      if (query && !label.toLowerCase().includes(query)) continue;
      const value = categoryData[key];
      matchedLines.push(`${formatSettingValue(category, key, value)} ${label}`);
    }

    if (matchedLines.length > 0) {
      lines.push(`**${CATEGORY_LABELS[category]}**`);
      lines.push(...matchedLines);
      lines.push('');
    }
  }

  const title = query ? `🔍 Поиск: «${search}»` : '⚙️ Настройки бота';
  const description = lines.length > 0 ? lines.join('\n') : '❌ Ничего не найдено.';

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: `Обновлено: ${new Date(settings.updatedAt).toLocaleString('uk-UA')}` })
    .setTimestamp();
}

function buildOverviewComponents(): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('settings_category')
      .setPlaceholder('Выберите категорию для настройки')
      .addOptions(
        Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
          label,
          value,
        }))
      )
  );

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('settings_reset')
      .setLabel('Сбросить всё')
      .setStyle(ButtonStyle.Danger)
  );

  return [selectRow, buttonRow];
}

function buildCategoryEmbed(settings: GuildSettings, category: string): EmbedBuilder {
  const categoryData = getCategoryData(settings, category);
  const labels = SETTING_LABELS[category];

  const lines: string[] = [];
  for (const [key, label] of Object.entries(labels)) {
    const value = categoryData[key];
    lines.push(`${formatSettingValue(category, key, value)} ${label}`);
  }

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${CATEGORY_LABELS[category]} — Настройки`)
    .setDescription(lines.join('\n'))
    .setTimestamp();
}

function buildCategoryComponents(
  settings: GuildSettings,
  category: string
): ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder>[] {
  const categoryData = getCategoryData(settings, category);
  const labels = SETTING_LABELS[category];
  const rows: ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder>[] = [];

  const toggleButtons: ButtonBuilder[] = [];
  const numericRows: ActionRowBuilder<ButtonBuilder>[] = [];

  for (const [key, label] of Object.entries(labels)) {
    if (isChannelSetting(category, key)) {
      const channelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(`settings_channel_${category}_${key}`)
          .setPlaceholder('📝 Выбрать канал для логов')
          .setChannelTypes(ChannelType.GuildText)
      );
      rows.push(channelRow);
      continue;
    }

    if (isNumericSetting(category, key)) {
      const value = categoryData[key] as number;
      const numRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`settings_dec_${category}_${key}`)
          .setLabel('➖')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`settings_numinfo_${category}_${key}`)
          .setLabel(`${label}: ${value}`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`settings_inc_${category}_${key}`)
          .setLabel('➕')
          .setStyle(ButtonStyle.Secondary)
      );
      numericRows.push(numRow);
      continue;
    }

    const enabled = categoryData[key] as boolean;
    toggleButtons.push(
      new ButtonBuilder()
        .setCustomId(`settings_toggle_${category}_${key}`)
        .setLabel(`${label}: ${enabled ? 'ON' : 'OFF'}`)
        .setStyle(enabled ? ButtonStyle.Success : ButtonStyle.Danger)
    );
  }

  for (let i = 0; i < toggleButtons.length; i += 5) {
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(toggleButtons.slice(i, i + 5)));
  }

  rows.push(...numericRows);

  const maxContentRows = 4;
  const contentRows = rows.slice(0, maxContentRows);

  contentRows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('settings_back')
        .setLabel('← Назад')
        .setStyle(ButtonStyle.Secondary)
    )
  );

  return contentRows;
}

export async function handleSettingsCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: '❌ Команда доступна только на сервере.', ephemeral: true });
    return;
  }

  const search = interaction.options.getString('search') || undefined;
  const settings = guildSettings.getSettings(guildId);
  const embed = buildOverviewEmbed(settings, search);
  const components = search ? [] : buildOverviewComponents();

  await interaction.reply({ embeds: [embed], components, ephemeral: true });
}

export async function handleSettingsButton(interaction: ButtonInteraction): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const member = interaction.member;
  if (!member || !('permissions' in member)) return;

  const customId = interaction.customId;

  if (customId === 'settings_back') {
    const settings = guildSettings.getSettings(guildId);
    await interaction.update({
      embeds: [buildOverviewEmbed(settings)],
      components: buildOverviewComponents(),
    });
    return;
  }

  if (customId === 'settings_reset') {
    const settings = guildSettings.resetSettings(guildId, interaction.user.id);
    await interaction.update({
      embeds: [buildOverviewEmbed(settings)],
      components: buildOverviewComponents(),
    });
    return;
  }

  const toggleMatch = customId.match(/^settings_toggle_(\w+)_(\w+)$/);
  if (toggleMatch) {
    const [, category, key] = toggleMatch;
    const current = guildSettings.getSettings(guildId);
    const categoryData = getCategoryData(current, category);
    const newValue = !(categoryData[key] as boolean);

    const settings = guildSettings.updateSettings(
      guildId,
      { [category]: { [key]: newValue } },
      interaction.user.id
    );

    await interaction.update({
      embeds: [buildCategoryEmbed(settings, category)],
      components: buildCategoryComponents(settings, category),
    });
    return;
  }

  const incMatch = customId.match(/^settings_inc_(\w+)_(\w+)$/);
  const decMatch = customId.match(/^settings_dec_(\w+)_(\w+)$/);
  const numMatch = incMatch || decMatch;
  if (numMatch) {
    const isInc = !!incMatch;
    const [, category, key] = numMatch;
    const numKey = `${category}.${key}`;
    const config = NUMERIC_SETTINGS[numKey];
    if (!config) return;

    const current = guildSettings.getSettings(guildId);
    const categoryData = getCategoryData(current, category);
    const currentValue = categoryData[key] as number;

    let newValue = isInc ? currentValue + config.step : currentValue - config.step;
    newValue = Math.round(newValue * 100) / 100;
    newValue = Math.max(config.min, Math.min(config.max, newValue));

    const settings = guildSettings.updateSettings(
      guildId,
      { [category]: { [key]: newValue } },
      interaction.user.id
    );

    await interaction.update({
      embeds: [buildCategoryEmbed(settings, category)],
      components: buildCategoryComponents(settings, category),
    });
  }
}

export async function handleSettingsSelectMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const category = interaction.values[0];
  const settings = guildSettings.getSettings(guildId);

  await interaction.update({
    embeds: [buildCategoryEmbed(settings, category)],
    components: buildCategoryComponents(settings, category),
  });
}

export async function handleSettingsChannelSelect(
  interaction: ChannelSelectMenuInteraction
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const match = interaction.customId.match(/^settings_channel_(\w+)_(\w+)$/);
  if (!match) return;

  const [, category, key] = match;
  const channelId = interaction.values[0] || '';

  const settings = guildSettings.updateSettings(
    guildId,
    { [category]: { [key]: channelId } },
    interaction.user.id
  );

  await interaction.update({
    embeds: [buildCategoryEmbed(settings, category)],
    components: buildCategoryComponents(settings, category),
  });
}
