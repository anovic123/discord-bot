import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { guildSettings, type GuildSettings, type AIProviderType } from '../../settings';
import { encrypt } from '../../encryption';
import { requireAdmin } from '../utils/permissions';
import { AVAILABLE_CURRENCIES } from '../../monobank/client';
import { GROQ_MODELS, DEFAULT_GROQ_MODEL } from '../utils/groq';
import { OPENAI_MODELS, DEFAULT_OPENAI_MODEL } from '../utils/openai';

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
  },
  logging: {
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

function statusIcon(enabled: boolean): string {
  return enabled ? '🟢' : '🔴';
}

function getCategoryData(settings: GuildSettings, category: string): Record<string, unknown> {
  return settings[category as SettingsCategory] as unknown as Record<string, unknown>;
}

function formatSettingValue(category: string, key: string, value: unknown): string {
  if (category === 'logging' && key === 'userIds') {
    const ids = value as string[];
    return ids.length > 0 ? ids.map((id) => `<@${id}>`).join(', ') : '❌ Не заданы';
  }
  if (isNumericSetting(category, key)) {
    return `**${value}**`;
  }
  return statusIcon(value as boolean);
}

function getModelsForProvider(provider: AIProviderType): readonly string[] {
  return provider === 'groq' ? GROQ_MODELS : OPENAI_MODELS;
}

function getDefaultModel(provider: AIProviderType): string {
  return provider === 'groq' ? DEFAULT_GROQ_MODEL : DEFAULT_OPENAI_MODEL;
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

    if (category === 'dailyReport' && (!query || 'валюты'.includes(query))) {
      matchedLines.push(`💱 Валюты: **${settings.dailyReport.currencies.join(', ')}**`);
    }

    if (category === 'ai' && (!query || 'провайдер'.includes(query))) {
      const providerLabel = settings.ai.provider === 'openai' ? 'OpenAI' : 'Groq';
      matchedLines.push(`🧠 AI Провайдер: **${providerLabel}**`);
      const model = settings.ai.model || getDefaultModel(settings.ai.provider);
      matchedLines.push(`🤖 Модель: **${model}**`);
    }

    if (category === 'logging' && (!query || 'получатели'.includes(query))) {
      const userIds = settings.logging.userIds;
      const val = userIds.length > 0 ? userIds.map((id) => `<@${id}>`).join(', ') : '❌ Не заданы';
      matchedLines.push(`👤 Получатели логов: ${val}`);
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

  if (category === 'dailyReport') {
    lines.push(`💱 Валюты: **${settings.dailyReport.currencies.join(', ')}**`);
  }

  if (category === 'ai') {
    const providerLabel = settings.ai.provider === 'openai' ? 'OpenAI' : 'Groq';
    lines.push(`🧠 AI Провайдер: **${providerLabel}**`);
    const model = settings.ai.model || getDefaultModel(settings.ai.provider);
    lines.push(`🤖 Модель: **${model}**`);
    lines.push(`📊 Лимит: **${settings.ai.maxRequestsPerDay}**/день`);
    lines.push(`⏱️ Кулдаун: **${settings.ai.cooldownSeconds}** сек`);
    lines.push(`🌡️ Температура: **${settings.ai.temperature}**`);
    const hasGroqKey = !!settings.ai.groqApiKey;
    const hasOpenaiKey = !!settings.ai.openaiApiKey;
    lines.push(`🔑 Groq API Key: ${hasGroqKey ? '✅ Задан' : '📌 ENV'}`);
    lines.push(`🔑 OpenAI API Key: ${hasOpenaiKey ? '✅ Задан' : '📌 ENV'}`);
  }

  if (category === 'logging') {
    const userIds = settings.logging.userIds;
    const val = userIds.length > 0 ? userIds.map((id) => `<@${id}>`).join(', ') : '❌ Не заданы';
    lines.push(`👤 Получатели логов: ${val}`);
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
): ActionRowBuilder<ButtonBuilder | UserSelectMenuBuilder | StringSelectMenuBuilder>[] {
  const categoryData = getCategoryData(settings, category);
  const labels = SETTING_LABELS[category];
  const rows: ActionRowBuilder<ButtonBuilder | UserSelectMenuBuilder | StringSelectMenuBuilder>[] =
    [];

  const toggleButtons: ButtonBuilder[] = [];

  for (const [key, label] of Object.entries(labels)) {
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

  if (category === 'dailyReport') {
    const currencySelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('settings_currencies')
        .setPlaceholder('💱 Выбрать валюты')
        .setMinValues(1)
        .setMaxValues(AVAILABLE_CURRENCIES.length)
        .addOptions(
          AVAILABLE_CURRENCIES.map((code) => ({
            label: `${code}/UAH`,
            value: code,
            default: settings.dailyReport.currencies.includes(code),
          }))
        )
    );
    rows.push(currencySelect);
  }

  if (category === 'ai') {
    const currentProvider = settings.ai.provider;

    const providerRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('settings_provider_groq')
        .setLabel('Groq')
        .setStyle(currentProvider === 'groq' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('settings_provider_openai')
        .setLabel('OpenAI')
        .setStyle(currentProvider === 'openai' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('settings_ai_apikey')
        .setLabel('🔑 API Key')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('settings_ai_params')
        .setLabel('⚙️ Параметры')
        .setStyle(ButtonStyle.Secondary)
    );
    rows.push(providerRow);

    const models = getModelsForProvider(currentProvider);
    const currentModel = settings.ai.model || getDefaultModel(currentProvider);

    const modelSelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('settings_ai_model')
        .setPlaceholder('🤖 Выбрать модель')
        .addOptions(
          models.map((m) => ({
            label: m,
            value: m,
            default: m === currentModel,
          }))
        )
    );
    rows.push(modelSelect);
  }

  if (category === 'logging') {
    const userSelect = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId('settings_log_users')
        .setPlaceholder('👤 Выбрать получателей логов')
        .setMinValues(0)
        .setMaxValues(10)
    );
    rows.push(userSelect);
  }

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

  const providerMatch = customId.match(/^settings_provider_(groq|openai)$/);
  if (providerMatch) {
    const newProvider = providerMatch[1] as AIProviderType;
    const settings = guildSettings.updateSettings(
      guildId,
      { ai: { provider: newProvider, model: '' } },
      interaction.user.id
    );

    await interaction.update({
      embeds: [buildCategoryEmbed(settings, 'ai')],
      components: buildCategoryComponents(settings, 'ai'),
    });
    return;
  }

  if (customId === 'settings_ai_apikey') {
    const modal = new ModalBuilder().setCustomId('settings_modal_apikey').setTitle('🔑 API ключи');

    const groqInput = new TextInputBuilder()
      .setCustomId('groq_key')
      .setLabel('Groq API Key (пустое = переменная окружения)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(200)
      .setPlaceholder('gsk_...');

    const openaiInput = new TextInputBuilder()
      .setCustomId('openai_key')
      .setLabel('OpenAI API Key (пустое = переменная окружения)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(200)
      .setPlaceholder('sk-...');

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(groqInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(openaiInput)
    );

    await interaction.showModal(modal);
    return;
  }

  if (customId === 'settings_ai_params') {
    const current = guildSettings.getSettings(guildId);

    const modal = new ModalBuilder()
      .setCustomId('settings_modal_aiconfig')
      .setTitle('⚙️ Параметры AI');

    const maxReqInput = new TextInputBuilder()
      .setCustomId('max_requests')
      .setLabel('Лимит запросов в день (10-200)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(String(current.ai.maxRequestsPerDay));

    const cooldownInput = new TextInputBuilder()
      .setCustomId('cooldown')
      .setLabel('Кулдаун в секундах (0-60)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(String(current.ai.cooldownSeconds));

    const tempInput = new TextInputBuilder()
      .setCustomId('temperature')
      .setLabel('Температура (0.1-1.5)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(String(current.ai.temperature));

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(maxReqInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(cooldownInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(tempInput)
    );

    await interaction.showModal(modal);
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

  if (interaction.customId === 'settings_currencies') {
    const currencies = interaction.values;
    const settings = guildSettings.updateSettings(
      guildId,
      { dailyReport: { currencies } },
      interaction.user.id
    );

    await interaction.update({
      embeds: [buildCategoryEmbed(settings, 'dailyReport')],
      components: buildCategoryComponents(settings, 'dailyReport'),
    });
    return;
  }

  if (interaction.customId === 'settings_ai_model') {
    const model = interaction.values[0];
    const settings = guildSettings.updateSettings(guildId, { ai: { model } }, interaction.user.id);

    await interaction.update({
      embeds: [buildCategoryEmbed(settings, 'ai')],
      components: buildCategoryComponents(settings, 'ai'),
    });
    return;
  }

  const category = interaction.values[0];
  const settings = guildSettings.getSettings(guildId);

  await interaction.update({
    embeds: [buildCategoryEmbed(settings, category)],
    components: buildCategoryComponents(settings, category),
  });
}

export async function handleSettingsUserSelect(
  interaction: UserSelectMenuInteraction
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return;

  if (interaction.customId === 'settings_log_users') {
    const userIds = interaction.values;
    const settings = guildSettings.updateSettings(
      guildId,
      { logging: { userIds } },
      interaction.user.id
    );

    await interaction.update({
      embeds: [buildCategoryEmbed(settings, 'logging')],
      components: buildCategoryComponents(settings, 'logging'),
    });
  }
}

export async function handleSettingsAIConfigModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const maxRequests = parseInt(interaction.fields.getTextInputValue('max_requests'), 10);
  const cooldown = parseInt(interaction.fields.getTextInputValue('cooldown'), 10);
  const temperature = parseFloat(interaction.fields.getTextInputValue('temperature'));

  if (isNaN(maxRequests) || isNaN(cooldown) || isNaN(temperature)) {
    await interaction.reply({ content: '❌ Некорректные значения.', ephemeral: true });
    return;
  }

  const clampedMax = Math.max(10, Math.min(200, maxRequests));
  const clampedCooldown = Math.max(0, Math.min(60, cooldown));
  const clampedTemp = Math.max(0.1, Math.min(1.5, Math.round(temperature * 10) / 10));

  const settings = guildSettings.updateSettings(
    guildId,
    {
      ai: {
        maxRequestsPerDay: clampedMax,
        cooldownSeconds: clampedCooldown,
        temperature: clampedTemp,
      },
    },
    interaction.user.id
  );

  await interaction.reply({
    embeds: [buildCategoryEmbed(settings, 'ai')],
    components: buildCategoryComponents(settings, 'ai'),
    ephemeral: true,
  });
}

export async function handleSettingsAPIKeyModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const groqKey = interaction.fields.getTextInputValue('groq_key').trim();
  const openaiKey = interaction.fields.getTextInputValue('openai_key').trim();

  const update: { groqApiKey?: string; openaiApiKey?: string } = {};

  if (groqKey) {
    update.groqApiKey = encrypt(groqKey);
  } else {
    update.groqApiKey = '';
  }

  if (openaiKey) {
    update.openaiApiKey = encrypt(openaiKey);
  } else {
    update.openaiApiKey = '';
  }

  const settings = guildSettings.updateSettings(guildId, { ai: update }, interaction.user.id);

  const statusLines = [
    `🔑 Groq API Key: ${settings.ai.groqApiKey ? '✅ Задан' : '📌 ENV'}`,
    `🔑 OpenAI API Key: ${settings.ai.openaiApiKey ? '✅ Задан' : '📌 ENV'}`,
  ];

  await interaction.reply({
    content: `API ключи обновлены:\n${statusLines.join('\n')}`,
    ephemeral: true,
  });
}
