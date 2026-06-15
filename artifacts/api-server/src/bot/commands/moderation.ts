import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
  EmbedBuilder,
} from "discord.js";
import { db } from "@workspace/db";
import { warnsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { getConfig } from "../utils/config";
import { successEmbed, errorEmbed, warnEmbed } from "../utils/embeds";
import { logger } from "../../lib/logger";

export const warnCommand = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Dar um aviso a um membro")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((o) => o.setName("membro").setDescription("Membro a ser avisado").setRequired(true))
  .addStringOption((o) => o.setName("motivo").setDescription("Motivo do aviso").setRequired(true));

export const warnsCommand = new SlashCommandBuilder()
  .setName("warns")
  .setDescription("Ver avisos de um membro")
  .addUserOption((o) => o.setName("membro").setDescription("Membro").setRequired(true));

export const clearwarnCommand = new SlashCommandBuilder()
  .setName("clearwarn")
  .setDescription("Remover um aviso pelo ID")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addStringOption((o) => o.setName("id").setDescription("ID do aviso").setRequired(true));

export async function handleWarn(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("membro", true);
  const reason = interaction.options.getString("motivo", true);
  const guild = interaction.guild!;

  await db.insert(warnsTable).values({
    discordId: target.id,
    username: target.username,
    reason,
    moderatorId: interaction.user.id,
    moderatorName: interaction.user.username,
  });

  const allWarns = await db.select().from(warnsTable).where(eq(warnsTable.discordId, target.id));
  const config = await getConfig(guild.id);
  const warnCount = allWarns.length;

  const embed = successEmbed(
    "Aviso aplicado",
    `${target} recebeu um aviso.\n**Motivo:** ${reason}\n**Total de avisos:** ${warnCount}`,
  );
  await interaction.reply({ embeds: [embed] });

  // Log to mod-log channel
  if (config?.modLogChannelId) {
    const logCh = guild.channels.cache.get(config.modLogChannelId) as TextChannel | undefined;
    if (logCh) {
      const logEmbed = new EmbedBuilder()
        .setColor(0xeab308)
        .setTitle("⚠️ Novo Aviso")
        .addFields(
          { name: "Membro", value: `${target} (${target.id})`, inline: true },
          { name: "Moderador", value: `${interaction.user}`, inline: true },
          { name: "Motivo", value: reason },
          { name: "Total de avisos", value: `${warnCount}`, inline: true },
        )
        .setTimestamp();
      await logCh.send({ embeds: [logEmbed] }).catch(() => {});
    }
  }

  // Auto-action on max warns
  if (config?.maxWarns && warnCount >= config.maxWarns) {
    const member = guild.members.cache.get(target.id);
    if (member) {
      await member
        .timeout(7 * 24 * 60 * 60 * 1000, `Atingiu o máximo de avisos (${warnCount})`)
        .catch(() => {});
      await interaction.followUp({
        embeds: [warnEmbed("Máximo de avisos atingido", `${target} foi silenciado por 7 dias.`)],
      });
    }
  }
}

export async function handleWarns(interaction: ChatInputCommandInteraction): Promise<void> {
  const target = interaction.options.getUser("membro", true);
  const warns = await db.select().from(warnsTable).where(eq(warnsTable.discordId, target.id));

  if (warns.length === 0) {
    await interaction.reply({ embeds: [successEmbed("Sem avisos", `${target} não tem nenhum aviso.`)], ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xeab308)
    .setTitle(`⚠️ Avisos de ${target.username}`)
    .setDescription(
      warns
        .map((w, i) => `**${i + 1}.** \`${w.id.slice(0, 8)}\` — ${w.reason}\n> Por ${w.moderatorName} • <t:${Math.floor(w.createdAt.getTime() / 1000)}:R>`)
        .join("\n\n"),
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function handleClearwarn(interaction: ChatInputCommandInteraction): Promise<void> {
  const id = interaction.options.getString("id", true);

  const rows = await db.select().from(warnsTable).where(eq(warnsTable.id, id)).limit(1);
  if (!rows[0]) {
    await interaction.reply({ embeds: [errorEmbed("Aviso não encontrado", `ID: \`${id}\``)], ephemeral: true });
    return;
  }

  await db.delete(warnsTable).where(eq(warnsTable.id, id));
  await interaction.reply({ embeds: [successEmbed("Aviso removido", `Aviso \`${id.slice(0, 8)}\` foi removido.`)] });
}
