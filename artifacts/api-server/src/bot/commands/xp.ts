import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { db } from "@workspace/db";
import { xpTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { xpEmbed, errorEmbed } from "../utils/embeds";
import { levelFromXp, xpToNextLevel } from "../utils/xp";

export const xpCommand = new SlashCommandBuilder()
  .setName("xp")
  .setDescription("Comandos de XP e nível")
  .addSubcommand((s) =>
    s
      .setName("ver")
      .setDescription("Ver XP de um membro")
      .addUserOption((o) => o.setName("membro").setDescription("Membro (padrão: você)")),
  )
  .addSubcommand((s) => s.setName("rank").setDescription("Ver leaderboard de XP"))
  .addSubcommand((s) =>
    s
      .setName("dar")
      .setDescription("Dar XP a um membro (somente admins)")
      .addUserOption((o) => o.setName("membro").setDescription("Membro").setRequired(true))
      .addIntegerOption((o) =>
        o.setName("quantidade").setDescription("Quantidade de XP").setRequired(true).setMinValue(1),
      ),
  );

export async function handleXp(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();

  if (sub === "ver") {
    const target = interaction.options.getUser("membro") ?? interaction.user;
    const rows = await db.select().from(xpTable).where(eq(xpTable.discordId, target.id)).limit(1);
    const entry = rows[0];

    if (!entry) {
      await interaction.reply({ embeds: [errorEmbed("Sem dados", `${target.username} ainda não tem XP registrado.`)], ephemeral: true });
      return;
    }

    const embed = xpEmbed(entry.username, entry.xp, entry.level, entry.avatarUrl);
    embed.addFields({ name: "XP para próximo nível", value: `**${xpToNextLevel(entry.xp)}**`, inline: true });
    await interaction.reply({ embeds: [embed] });
  } else if (sub === "rank") {
    const top = await db.select().from(xpTable).orderBy(desc(xpTable.xp)).limit(10);

    if (top.length === 0) {
      await interaction.reply({ embeds: [errorEmbed("Sem dados", "Ninguém tem XP ainda.")], ephemeral: true });
      return;
    }

    const desc2 = top
      .map((e, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**${i + 1}.**`;
        return `${medal} <@${e.discordId}> — Nível ${e.level} | ${e.xp} XP`;
      })
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(0xa855f7)
      .setTitle("⚡ Leaderboard de XP")
      .setDescription(desc2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else if (sub === "dar") {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({ embeds: [errorEmbed("Sem permissão")], ephemeral: true });
      return;
    }
    const target = interaction.options.getUser("membro", true);
    const amount = interaction.options.getInteger("quantidade", true);

    const rows = await db.select().from(xpTable).where(eq(xpTable.discordId, target.id)).limit(1);
    const current = rows[0] ?? { xp: 0, level: 1 };
    const newXp = current.xp + amount;
    const newLevel = Math.max(1, levelFromXp(newXp));

    await db
      .insert(xpTable)
      .values({ discordId: target.id, username: target.username, xp: newXp, level: newLevel })
      .onConflictDoUpdate({ target: xpTable.discordId, set: { xp: newXp, level: newLevel } });

    await interaction.reply({
      embeds: [xpEmbed(target.username, newXp, newLevel).setTitle(`✅ XP adicionado — ${target.username}`)],
    });
  }
}
