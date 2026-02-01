import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { GameActivityUseCase } from '../../../application/game-activity.use-case';

export const gamestatsCommand = new SlashCommandBuilder()
  .setName('gamestats')
  .setDescription('Статистика игровой активности')
  .addSubcommand(subcommand =>
    subcommand
      .setName('user')
      .setDescription('Статистика пользователя')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('Пользователь (по умолчанию — вы)')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('top')
      .setDescription('Топ игр на сервере')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('leaderboard')
      .setDescription('Лидерборд по игре')
      .addStringOption(option =>
        option
          .setName('game')
          .setDescription('Название игры')
          .setRequired(true)
      )
  );

export async function handleGamestatsCommand(
  interaction: ChatInputCommandInteraction,
  gameActivityUseCase: GameActivityUseCase
): Promise<void> {
  await interaction.deferReply();

  try {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'user':
        await handleUserStats(interaction, gameActivityUseCase);
        break;
      case 'top':
        await handleTopGames(interaction, gameActivityUseCase);
        break;
      case 'leaderboard':
        await handleLeaderboard(interaction, gameActivityUseCase);
        break;
    }
  } catch (error) {
    console.error('Failed to get game stats:', error);
    await interaction.editReply('❌ Не удалось получить статистику.');
  }
}

async function handleUserStats(
  interaction: ChatInputCommandInteraction,
  useCase: GameActivityUseCase
): Promise<void> {
  const targetUser = interaction.options.getUser('user') ?? interaction.user;

  const result = useCase.getUserStats(
    targetUser.id,
    targetUser.username,
    targetUser.displayAvatarURL({ size: 128 })
  );

  if (!result.hasData) {
    await interaction.editReply(`📊 У **${result.username}** пока нет игровой статистики.`);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle(`🎮 Игровая статистика`)
    .setDescription(`Пользователь: **${result.username}**`);

  if (result.avatarUrl) {
    embed.setThumbnail(result.avatarUrl);
  }

  if (result.activeSession) {
    embed.addFields({
      name: '▶️ Сейчас играет',
      value: result.activeSession,
      inline: false,
    });
  }

  if (result.uniqueGames > 0) {
    embed.addFields(
      { name: '⏱️ Всего наиграно', value: result.totalTime, inline: true },
      { name: '🎯 Уникальных игр', value: `${result.uniqueGames}`, inline: true },
      { name: '🔄 Сессий', value: `${result.totalSessions}`, inline: true }
    );

    if (result.gamesText) {
      embed.addFields({
        name: `📋 Топ игр (${result.gamesCount.shown}/${result.gamesCount.total})`,
        value: result.gamesText,
        inline: false,
      });
    }
  }

  embed
    .setFooter({ text: `Запрос от ${interaction.user.tag}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleTopGames(
  interaction: ChatInputCommandInteraction,
  useCase: GameActivityUseCase
): Promise<void> {
  const result = useCase.getTopGames();

  if (!result.hasData) {
    await interaction.editReply('📊 Пока нет статистики по играм на сервере.');
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xE91E63)
    .setTitle('🏆 Топ игр на сервере')
    .setDescription(`Всего наиграно: **${result.totalTime}**`)
    .addFields({
      name: '📋 Рейтинг',
      value: result.gamesText,
      inline: false,
    })
    .setFooter({ text: `Запрос от ${interaction.user.tag}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleLeaderboard(
  interaction: ChatInputCommandInteraction,
  useCase: GameActivityUseCase
): Promise<void> {
  const gameName = interaction.options.getString('game', true);

  const result = useCase.getLeaderboard(gameName, (userId) => {
    const member = interaction.guild?.members.cache.get(userId);
    return member?.user.username ?? `<@${userId}>`;
  });

  if (!result.hasData) {
    await interaction.editReply(
      `📊 Никто ещё не играл в **${result.gameName}** (или название игры написано неправильно).`
    );
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle(`🏆 Лидерборд: ${result.gameName}`)
    .addFields({
      name: '📋 Рейтинг игроков',
      value: result.entriesText,
      inline: false,
    })
    .setFooter({ text: `Запрос от ${interaction.user.tag}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
