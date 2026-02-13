import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
} from 'discord.js';

export const whoisCommand = new SlashCommandBuilder()
  .setName('whois')
  .setDescription('Подробная информация о пользователе')
  .addUserOption((option) =>
    option.setName('user').setDescription('Пользователь').setRequired(false)
  );

export async function handleWhoisCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const targetUser = interaction.options.getUser('user') ?? interaction.user;

  let member: GuildMember | null = null;
  try {
    member = (await interaction.guild?.members.fetch(targetUser.id)) ?? null;
  } catch {
    member = null;
  }

  const user = await targetUser.fetch(true);

  const flags = user.flags?.toArray() ?? [];
  const badges =
    flags
      .map((flag) => {
        const badgeMap: Record<string, string> = {
          Staff: '👨‍💼 Discord Staff',
          Partner: '🤝 Partner',
          Hypesquad: '🏠 HypeSquad Events',
          BugHunterLevel1: '🐛 Bug Hunter',
          BugHunterLevel2: '🐛 Bug Hunter Gold',
          HypeSquadOnlineHouse1: '🏠 Bravery',
          HypeSquadOnlineHouse2: '🏠 Brilliance',
          HypeSquadOnlineHouse3: '🏠 Balance',
          PremiumEarlySupporter: '👑 Early Supporter',
          VerifiedDeveloper: '✅ Verified Bot Dev',
          ActiveDeveloper: '👨‍💻 Active Developer',
          CertifiedModerator: '🛡️ Certified Mod',
        };
        return badgeMap[flag] ?? flag;
      })
      .join('\n') || 'Нет';

  const embed = new EmbedBuilder()
    .setColor(user.accentColor ?? member?.displayColor ?? 0x5865f2)
    .setTitle(`👤 ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({ size: 512 }))
    .addFields(
      { name: '🆔 ID', value: user.id, inline: true },
      { name: '🤖 Бот', value: user.bot ? 'Да' : 'Нет', inline: true },
      {
        name: '📅 Создан',
        value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
        inline: true,
      }
    );

  if (member) {
    embed.addFields(
      {
        name: '📥 Присоединился',
        value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`,
        inline: true,
      },
      { name: '📛 Никнейм', value: member.nickname ?? 'Нет', inline: true },
      { name: '🎨 Цвет', value: member.displayHexColor, inline: true }
    );

    if (member.premiumSince) {
      embed.addFields({
        name: '💎 Бустер с',
        value: `<t:${Math.floor(member.premiumSince.getTime() / 1000)}:R>`,
        inline: true,
      });
    }

    const roles = member.roles.cache
      .filter((r) => r.id !== interaction.guild?.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => `<@&${r.id}>`)
      .slice(0, 10)
      .join(', ');

    if (roles) {
      embed.addFields({
        name: `🎭 Роли (${member.roles.cache.size - 1})`,
        value: roles.slice(0, 1024),
      });
    }
  }

  embed.addFields({ name: '🏅 Значки', value: badges });

  if (user.banner) {
    embed.setImage(user.bannerURL({ size: 512 }) ?? '');
  }

  embed.setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
