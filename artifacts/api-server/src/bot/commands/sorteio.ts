import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonInteraction,
  TextChannel,
  EmbedBuilder,
  PermissionFlagsBits,
  Collection,
} from "discord.js";
import { db } from "@workspace/db";
import { sorteiosTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { sorteioEmbed, successEmbed, errorEmbed } from "../utils/embeds";
import { logger } from "../../lib/logger";

// In-memory participant tracking (resets on restart — good enough for dev)
const participants = new Map<string, Set<string>>(); // sorteioId -> Set<userId>

export const sorteioCommand = new SlashCommandBuilder()
  .setName("sorteio")
  .setDescription("Gerenciar sorteios")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((s) =>
    s
      .setName("criar")
      .setDescription("Criar um novo sorteio")
      .addStringOption((o) => o.setName("premio").setDescription("Prêmio do sorteio").setRequired(true))
      .addIntegerOption((o) => o.setName("duracao").setDescription("Duração em minutos").setRequired(true).setMinValue(1))
      .addIntegerOption((o) => o.setName("ganhadores").setDescription("Número de ganhadores").setMinValue(1).setMaxValue(10))
      .addStringOption((o) => o.setName("descricao").setDescription("Descrição opcional")),
  )
  .addSubcommand((s) =>
    s
      .setName("sortear")
      .setDescription("Sortear vencedores agora")
      .addStringOption((o) => o.setName("id").setDescription("ID do sorteio (8 primeiros caracteres)").setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName("cancelar")
      .setDescription("Cancelar um sorteio")
      .addStringOption((o) => o.setName("id").setDescription("ID do sorteio").setRequired(true)),
  );

export async function handleSorteio(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();

  if (sub === "criar") {
    const prize = interaction.options.getString("premio", true);
    const duracao = interaction.options.getInteger("duracao", true);
    const ganhadores = interaction.options.getInteger("ganhadores") ?? 1;
    const descricao = interaction.options.getString("descricao");

    const endAt = new Date(Date.now() + duracao * 60_000);

    const [sorteio] = await db
      .insert(sorteiosTable)
      .values({
        prize,
        description: descricao,
        channelId: interaction.channelId,
        createdBy: interaction.user.username,
        endAt,
        status: "active",
        winners: ganhadores,
      })
      .returning();

    const embed = sorteioEmbed(prize, descricao, endAt, ganhadores, 0, interaction.user.username);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`sorteio:participar:${sorteio.id}`)
        .setLabel("Participar")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🎉"),
    );

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    await db.update(sorteiosTable).set({ messageId: msg.id }).where(eq(sorteiosTable.id, sorteio.id));

    // Auto-draw when time's up
    setTimeout(async () => {
      await drawWinners(sorteio.id, interaction.channel as TextChannel);
    }, duracao * 60_000);
  } else if (sub === "sortear") {
    const id = interaction.options.getString("id", true);
    const rows = await db.select().from(sorteiosTable).where(eq(sorteiosTable.id, id)).limit(1);
    const row = rows.find((r) => r.id.startsWith(id)) ?? rows[0];

    if (!row) { await interaction.reply({ embeds: [errorEmbed("Sorteio não encontrado")], ephemeral: true }); return; }
    if (row.status !== "active") { await interaction.reply({ embeds: [errorEmbed("Sorteio inativo")], ephemeral: true }); return; }

    await drawWinners(row.id, interaction.channel as TextChannel);
    await interaction.reply({ embeds: [successEmbed("Sorteio realizado!")], ephemeral: true });
  } else if (sub === "cancelar") {
    const id = interaction.options.getString("id", true);
    await db.update(sorteiosTable).set({ status: "cancelled" }).where(eq(sorteiosTable.id, id));
    await interaction.reply({ embeds: [successEmbed("Sorteio cancelado")] });
  }
}

export async function handleParticipar(interaction: ButtonInteraction, sorteioId: string): Promise<void> {
  const userId = interaction.user.id;

  if (!participants.has(sorteioId)) participants.set(sorteioId, new Set());
  const set = participants.get(sorteioId)!;

  if (set.has(userId)) {
    set.delete(userId);
    await db.update(sorteiosTable).set({ participants: set.size }).where(eq(sorteiosTable.id, sorteioId));
    await interaction.reply({ content: "❌ Você saiu do sorteio.", ephemeral: true });
    return;
  }

  set.add(userId);
  await db.update(sorteiosTable).set({ participants: set.size }).where(eq(sorteiosTable.id, sorteioId));

  // Update embed
  const rows = await db.select().from(sorteiosTable).where(eq(sorteiosTable.id, sorteioId)).limit(1);
  const sorteio = rows[0];
  if (sorteio && interaction.message) {
    const embed = sorteioEmbed(sorteio.prize, sorteio.description, sorteio.endAt, sorteio.winners, set.size, sorteio.createdBy);
    await interaction.message.edit({ embeds: [embed] }).catch(() => {});
  }

  await interaction.reply({ content: "✅ Você entrou no sorteio! Boa sorte 🍀", ephemeral: true });
}

async function drawWinners(sorteioId: string, channel: TextChannel | null) {
  try {
    const rows = await db.select().from(sorteiosTable).where(eq(sorteiosTable.id, sorteioId)).limit(1);
    const sorteio = rows[0];
    if (!sorteio || sorteio.status !== "active") return;

    const set = participants.get(sorteioId) ?? new Set<string>();
    const pool = Array.from(set);

    const winnerCount = Math.min(sorteio.winners, pool.length);
    const winnerIds: string[] = [];
    const shuffled = pool.sort(() => Math.random() - 0.5);
    for (let i = 0; i < winnerCount; i++) winnerIds.push(shuffled[i]);

    await db
      .update(sorteiosTable)
      .set({ status: "ended", winnerIds })
      .where(eq(sorteiosTable.id, sorteioId));

    if (!channel) return;

    if (winnerIds.length === 0) {
      await channel.send({ embeds: [new EmbedBuilder().setColor(0xef4444).setTitle("🎉 Sorteio Encerrado").setDescription(`**${sorteio.prize}** — Ninguém participou.`)] });
      return;
    }

    const mentions = winnerIds.map((id) => `<@${id}>`).join(", ");
    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle("🎉 Sorteio Encerrado!")
      .setDescription(`**Prêmio:** ${sorteio.prize}\n\n🏆 **Ganhador(es):** ${mentions}`)
      .setTimestamp();

    await channel.send({ content: `Parabéns ${mentions}!`, embeds: [embed] });
  } catch (err) {
    logger.error({ err, sorteioId }, "drawWinners error");
  }
}
