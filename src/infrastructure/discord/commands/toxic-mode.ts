import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { guildSettings, type ToxicModeSettings } from '../../settings';
import { requireAdmin } from '../utils/permissions';
import { toxicModeManager } from '../utils/toxic-mode-manager';

const FREQUENCIES = [1, 5, 15, 30, 60];
const LIMIT_STEP = 5;
const LIMIT_MIN = 5;
const LIMIT_MAX = 100;

export const toxicModeCommand = new SlashCommandBuilder()
  .setName('toxic-mode')
  .setDescription('Токсичный режим — AI шутки про активных пользователей');

function buildSettingsEmbed(settings: ToxicModeSettings, guildId: string): EmbedBuilder {
  const status = settings.enabled ? '🟢 Включён' : '🔴 Выключен';
  const channel = settings.channelId ? `<#${settings.channelId}>` : 'Не задан';
  const dailyUsed = toxicModeManager.getDailyCount(guildId);

  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle('☢️ Toxic Mode')
    .setDescription(
      [
        `**Статус:** ${status}`,
        `**Канал:** ${channel}`,
        `**Частота:** каждые ${settings.frequencyMinutes} мин`,
        `**Лимит:** ${dailyUsed}/${settings.maxPerDay} в день`,
      ].join('\n')
    )
    .setTimestamp();
}

function buildButtons(settings: ToxicModeSettings): ActionRowBuilder<ButtonBuilder>[] {
  const freqIndex = FREQUENCIES.indexOf(settings.frequencyMinutes);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('toxic_toggle')
      .setLabel(settings.enabled ? '🔴 Выключить' : '🟢 Включить')
      .setStyle(settings.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('toxic_channel')
      .setLabel('📌 Этот канал')
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('toxic_freq_down')
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(freqIndex <= 0),
    new ButtonBuilder()
      .setCustomId('toxic_freq_label')
      .setLabel(`⏱ ${settings.frequencyMinutes} мин`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('toxic_freq_up')
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(freqIndex >= FREQUENCIES.length - 1),
    new ButtonBuilder()
      .setCustomId('toxic_limit_down')
      .setLabel('➖ Лимит')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(settings.maxPerDay <= LIMIT_MIN),
    new ButtonBuilder()
      .setCustomId('toxic_limit_up')
      .setLabel('➕ Лимит')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(settings.maxPerDay >= LIMIT_MAX)
  );

  return [row1, row2];
}

export async function handleToxicModeCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: '❌ Команда доступна только на сервере.', ephemeral: true });
    return;
  }

  const settings = guildSettings.getSettings(guildId).toxicMode;
  await interaction.reply({
    embeds: [buildSettingsEmbed(settings, guildId)],
    components: buildButtons(settings),
    ephemeral: true,
  });
}

export async function handleToxicModeButton(interaction: ButtonInteraction): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const member = interaction.member;
  if (!member || !('permissions' in member)) return;

  const customId = interaction.customId;
  const current = guildSettings.getSettings(guildId).toxicMode;

  if (customId === 'toxic_toggle') {
    const newEnabled = !current.enabled;
    const updated = guildSettings.updateSettings(
      guildId,
      {
        toxicMode: { enabled: newEnabled },
      },
      interaction.user.id
    );

    if (newEnabled && updated.toxicMode.channelId) {
      toxicModeManager.startTimer(guildId);
    } else {
      toxicModeManager.stopTimer(guildId);
    }

    await interaction.update({
      embeds: [buildSettingsEmbed(updated.toxicMode, guildId)],
      components: buildButtons(updated.toxicMode),
    });
    return;
  }

  if (customId === 'toxic_channel') {
    const updated = guildSettings.updateSettings(
      guildId,
      {
        toxicMode: { channelId: interaction.channelId },
      },
      interaction.user.id
    );

    if (updated.toxicMode.enabled) {
      toxicModeManager.restartTimer(guildId);
    }

    await interaction.update({
      embeds: [buildSettingsEmbed(updated.toxicMode, guildId)],
      components: buildButtons(updated.toxicMode),
    });
    return;
  }

  if (customId === 'toxic_freq_down' || customId === 'toxic_freq_up') {
    const currentIndex = FREQUENCIES.indexOf(current.frequencyMinutes);
    const newIndex =
      customId === 'toxic_freq_down'
        ? Math.max(0, currentIndex - 1)
        : Math.min(FREQUENCIES.length - 1, currentIndex + 1);

    const updated = guildSettings.updateSettings(
      guildId,
      {
        toxicMode: { frequencyMinutes: FREQUENCIES[newIndex] },
      },
      interaction.user.id
    );

    if (updated.toxicMode.enabled && updated.toxicMode.channelId) {
      toxicModeManager.restartTimer(guildId);
    }

    await interaction.update({
      embeds: [buildSettingsEmbed(updated.toxicMode, guildId)],
      components: buildButtons(updated.toxicMode),
    });
    return;
  }

  if (customId === 'toxic_limit_down' || customId === 'toxic_limit_up') {
    const newLimit =
      customId === 'toxic_limit_down'
        ? Math.max(LIMIT_MIN, current.maxPerDay - LIMIT_STEP)
        : Math.min(LIMIT_MAX, current.maxPerDay + LIMIT_STEP);

    const updated = guildSettings.updateSettings(
      guildId,
      {
        toxicMode: { maxPerDay: newLimit },
      },
      interaction.user.id
    );

    await interaction.update({
      embeds: [buildSettingsEmbed(updated.toxicMode, guildId)],
      components: buildButtons(updated.toxicMode),
    });
    return;
  }
}
