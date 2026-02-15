import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { guildSettings, type WelcomeMessageConfig } from '../../settings';
import { requireAdmin } from '../utils/permissions';

const DEFAULT_CONFIG: WelcomeMessageConfig = {
  enabled: true,
  title: 'Добро пожаловать!',
  description: 'Привет, {user}! Добро пожаловать на **{server}**! Ты {memberCount}-й участник.',
  color: 0x57f287,
};

export const welcomeMessageCommand = new SlashCommandBuilder()
  .setName('welcome-message')
  .setDescription('Настройка приветствия новых участников');

function replaceVariables(
  text: string,
  vars: {
    userId: string;
    username: string;
    server: string;
    memberCount: number;
    avatar: string;
    createdTimestamp: number;
  }
): string {
  return text
    .replace(/\{user\}/g, `<@${vars.userId}>`)
    .replace(/\{username\}/g, vars.username)
    .replace(/\{server\}/g, vars.server)
    .replace(/\{memberCount\}/g, String(vars.memberCount))
    .replace(/\{avatar\}/g, vars.avatar)
    .replace(/\{createdAt\}/g, `<t:${vars.createdTimestamp}:R>`);
}

function buildPreviewEmbed(
  config: WelcomeMessageConfig,
  vars: {
    userId: string;
    username: string;
    server: string;
    memberCount: number;
    avatar: string;
    createdTimestamp: number;
  }
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(config.color)
    .setTitle(replaceVariables(config.title, vars))
    .setDescription(replaceVariables(config.description, vars))
    .setThumbnail(vars.avatar || null)
    .setTimestamp();
}

function buildSettingsEmbed(config: WelcomeMessageConfig): EmbedBuilder {
  const status = config.enabled ? '🟢 Включено' : '🔴 Выключено';
  const colorHex = `#${config.color.toString(16).padStart(6, '0')}`;

  return new EmbedBuilder()
    .setColor(config.color)
    .setTitle('👋 Настройка приветствия')
    .setDescription(
      [
        `**Статус:** ${status}`,
        '',
        `**Заголовок:** ${config.title}`,
        `**Текст:** ${config.description}`,
        `**Цвет:** ${colorHex}`,
        '',
        '**Переменные:**',
        '`{user}` — упоминание · `{username}` — имя',
        '`{server}` — сервер · `{memberCount}` — кол-во',
        '`{avatar}` — аватар · `{createdAt}` — дата создания',
      ].join('\n')
    )
    .setTimestamp();
}

function buildButtons(config: WelcomeMessageConfig): ActionRowBuilder<ButtonBuilder>[] {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('welcome_edit')
      .setLabel('✏️ Редактировать')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('welcome_toggle')
      .setLabel(config.enabled ? '🔴 Выключить' : '🟢 Включить')
      .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('welcome_preview')
      .setLabel('👀 Превью')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('welcome_reset')
      .setLabel('🔄 Сбросить')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1];
}

export async function handleWelcomeMessageCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: '❌ Команда доступна только на сервере.', ephemeral: true });
    return;
  }

  const config = guildSettings.getWelcomeMessage(guildId);
  await interaction.reply({
    embeds: [buildSettingsEmbed(config)],
    components: buildButtons(config),
    ephemeral: true,
  });
}

export async function handleWelcomeMessageButton(interaction: ButtonInteraction): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const member = interaction.member;
  if (!member || !('permissions' in member)) return;

  const customId = interaction.customId;

  if (customId === 'welcome_edit') {
    const config = guildSettings.getWelcomeMessage(guildId);
    const colorHex = `#${config.color.toString(16).padStart(6, '0')}`;

    const modal = new ModalBuilder()
      .setCustomId('welcome_modal')
      .setTitle('Редактировать приветствие');

    const titleInput = new TextInputBuilder()
      .setCustomId('welcome_title')
      .setLabel('Заголовок')
      .setStyle(TextInputStyle.Short)
      .setValue(config.title)
      .setMaxLength(256)
      .setRequired(true);

    const descInput = new TextInputBuilder()
      .setCustomId('welcome_description')
      .setLabel('Текст приветствия')
      .setStyle(TextInputStyle.Paragraph)
      .setValue(config.description)
      .setMaxLength(2000)
      .setRequired(true);

    const colorInput = new TextInputBuilder()
      .setCustomId('welcome_color')
      .setLabel('Цвет (#hex, например #57f287)')
      .setStyle(TextInputStyle.Short)
      .setValue(colorHex)
      .setMaxLength(7)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput)
    );

    await interaction.showModal(modal);
    return;
  }

  if (customId === 'welcome_toggle') {
    const config = guildSettings.getWelcomeMessage(guildId);
    const updated = guildSettings.setWelcomeMessage(
      guildId,
      { enabled: !config.enabled },
      interaction.user.id
    );

    await interaction.update({
      embeds: [buildSettingsEmbed(updated.welcomeMessage)],
      components: buildButtons(updated.welcomeMessage),
    });
    return;
  }

  if (customId === 'welcome_preview') {
    const config = guildSettings.getWelcomeMessage(guildId);
    const guild = interaction.guild;
    if (!guild) return;

    const vars = {
      userId: interaction.user.id,
      username: interaction.user.displayName,
      server: guild.name,
      memberCount: guild.memberCount,
      avatar: interaction.user.displayAvatarURL({ size: 256 }),
      createdTimestamp: Math.floor(interaction.user.createdTimestamp / 1000),
    };

    const embed = buildPreviewEmbed(config, vars);
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (customId === 'welcome_reset') {
    const updated = guildSettings.setWelcomeMessage(
      guildId,
      { ...DEFAULT_CONFIG },
      interaction.user.id
    );

    await interaction.update({
      embeds: [buildSettingsEmbed(updated.welcomeMessage)],
      components: buildButtons(updated.welcomeMessage),
    });
    return;
  }
}

export async function handleWelcomeMessageModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const title = interaction.fields.getTextInputValue('welcome_title');
  const description = interaction.fields.getTextInputValue('welcome_description');
  const colorRaw = interaction.fields.getTextInputValue('welcome_color').trim();

  const colorMatch = colorRaw.match(/^#?([0-9a-fA-F]{6})$/);
  if (!colorMatch) {
    await interaction.reply({
      content: '❌ Неверный формат цвета. Используйте HEX, например `#57f287`.',
      ephemeral: true,
    });
    return;
  }

  const color = parseInt(colorMatch[1], 16);

  const updated = guildSettings.setWelcomeMessage(
    guildId,
    { title, description, color },
    interaction.user.id
  );

  await interaction.reply({
    embeds: [buildSettingsEmbed(updated.welcomeMessage)],
    components: buildButtons(updated.welcomeMessage),
    ephemeral: true,
  });
}

export function buildWelcomeEmbed(
  config: WelcomeMessageConfig,
  vars: {
    userId: string;
    username: string;
    server: string;
    memberCount: number;
    avatar: string;
    createdTimestamp: number;
  }
): EmbedBuilder {
  return buildPreviewEmbed(config, vars);
}
