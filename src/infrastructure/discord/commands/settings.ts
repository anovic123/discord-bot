import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import { guildSettings, type GuildSettings } from '../../settings';
import { requireAdmin } from '../utils/permissions';

export const settingsCommand = new SlashCommandBuilder()
  .setName('settings')
  .setDescription('Управление настройками бота');

const CATEGORY_LABELS: Record<string, string> = {
  dailyReport: '📊 Ежедневный отчёт',
  welcome: '👋 Приветствие',
  moderation: '🛡️ Модерация',
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
};

type SettingsCategory = 'dailyReport' | 'welcome' | 'moderation';

function statusIcon(enabled: boolean): string {
  return enabled ? '🟢' : '🔴';
}

function getCategoryData(settings: GuildSettings, category: string): Record<string, boolean> {
  return settings[category as SettingsCategory] as unknown as Record<string, boolean>;
}

function buildOverviewEmbed(settings: GuildSettings): EmbedBuilder {
  const lines: string[] = [];

  for (const [category, keys] of Object.entries(SETTING_LABELS)) {
    const categoryData = getCategoryData(settings, category);
    lines.push(`**${CATEGORY_LABELS[category]}**`);
    for (const [key, label] of Object.entries(keys)) {
      lines.push(`${statusIcon(categoryData[key])} ${label}`);
    }
    lines.push('');
  }

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('⚙️ Настройки бота')
    .setDescription(lines.join('\n'))
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
    lines.push(`${statusIcon(categoryData[key])} ${label}`);
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
): ActionRowBuilder<ButtonBuilder>[] {
  const categoryData = getCategoryData(settings, category);
  const labels = SETTING_LABELS[category];

  const toggleButtons = Object.entries(labels).map(([key, label]) => {
    const enabled = categoryData[key];
    return new ButtonBuilder()
      .setCustomId(`settings_toggle_${category}_${key}`)
      .setLabel(`${label}: ${enabled ? 'ON' : 'OFF'}`)
      .setStyle(enabled ? ButtonStyle.Success : ButtonStyle.Danger);
  });

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  for (let i = 0; i < toggleButtons.length; i += 5) {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(toggleButtons.slice(i, i + 5))
    );
  }

  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('settings_back')
        .setLabel('← Назад')
        .setStyle(ButtonStyle.Secondary)
    )
  );

  return rows;
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

  const settings = guildSettings.getSettings(guildId);
  const embed = buildOverviewEmbed(settings);
  const components = buildOverviewComponents();

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
    const newValue = !categoryData[key];

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
