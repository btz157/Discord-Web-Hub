import type { GuildMember, TextChannel } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { getConfig } from "../utils/config";
import { logger } from "../../lib/logger";

export async function handleGuildMemberAdd(member: GuildMember) {
  try {
    const config = await getConfig(member.guild.id);
    if (!config) return;

    // Auto-role
    if (config.autoroleId) {
      const role = member.guild.roles.cache.get(config.autoroleId);
      if (role) {
        await member.roles.add(role).catch((err) => logger.warn({ err }, "Failed to add autorole"));
      }
    }

    // Welcome message
    if (config.welcomeChannelId) {
      const channel = member.guild.channels.cache.get(config.welcomeChannelId) as TextChannel | undefined;
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0x3b82f6)
          .setTitle("👋 Bem-vindo(a)!")
          .setDescription(`Olá ${member}, seja bem-vindo(a) ao **${member.guild.name}**!\nLeia as regras do servidor antes de prosseguir.`)
          .setThumbnail(member.user.displayAvatarURL())
          .addFields({ name: "Membros", value: `${member.guild.memberCount}`, inline: true })
          .setTimestamp();
        await channel.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    logger.error({ err }, "guildMemberAdd error");
  }
}
