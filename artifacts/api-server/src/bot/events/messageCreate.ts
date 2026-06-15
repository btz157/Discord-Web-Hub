import type { Message, TextChannel } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { addXp, levelFromXp } from "../utils/xp";
import { getConfig } from "../utils/config";
import { logger } from "../../lib/logger";

export async function handleMessageCreate(message: Message) {
  if (message.author.bot || !message.guild) return;

  try {
    const config = await getConfig(message.guild.id);
    if (!config?.xpEnabled) return;

    const avatarUrl = message.author.displayAvatarURL();
    const result = await addXp(
      message.author.id,
      message.author.username,
      avatarUrl,
      config.xpMultiplier,
    );

    if (result && result.newLevel > result.oldLevel) {
      const embed = new EmbedBuilder()
        .setColor(0xa855f7)
        .setTitle("⚡ Level Up!")
        .setDescription(`Parabéns ${message.author}! Você subiu para o **nível ${result.newLevel}**!`)
        .setThumbnail(avatarUrl)
        .setTimestamp();

      if ("send" in message.channel) {
        await (message.channel as { send: (...args: unknown[]) => Promise<unknown> }).send({ embeds: [embed] }).catch(() => {});
      }
    }
  } catch (err) {
    logger.error({ err }, "messageCreate XP error");
  }
}
