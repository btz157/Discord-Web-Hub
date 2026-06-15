import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ChannelType,
  PermissionsBitField,
  ButtonInteraction,
  TextChannel,
  EmbedBuilder,
  ComponentType,
} from "discord.js";
import { db } from "@workspace/db";
import { ticketsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { getConfig } from "../utils/config";
import { ticketEmbed, successEmbed, errorEmbed } from "../utils/embeds";
import { logger } from "../../lib/logger";

export const ticketSetupCommand = new SlashCommandBuilder()
  .setName("ticket-setup")
  .setDescription("Configurar painel de abertura de tickets no canal atual")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export const ticketCommand = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("Gerenciar tickets")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addSubcommand((s) => s.setName("fechar").setDescription("Fechar o ticket atual"))
  .addSubcommand((s) => s.setName("reabrir").setDescription("Reabrir o ticket atual"));

export async function handleTicketSetup(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x3b82f6)
    .setTitle("🎫 Suporte")
    .setDescription(
      "Precisa de ajuda? Clique no botão abaixo para abrir um ticket.\n\nNossa equipe responderá o mais rápido possível.",
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:open")
      .setLabel("Abrir Ticket")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🎫"),
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

export async function handleTicketCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();
  const channel = interaction.channel as TextChannel;
  const guild = interaction.guild!;

  const ticket = await db
    .select()
    .from(ticketsTable)
    .where(and(eq(ticketsTable.channelId, channel.id), eq(ticketsTable.status, "open")))
    .limit(1);

  if (!ticket[0]) {
    await interaction.reply({ embeds: [errorEmbed("Canal inválido", "Este canal não é um ticket aberto.")], ephemeral: true });
    return;
  }

  if (sub === "fechar") {
    await db
      .update(ticketsTable)
      .set({ status: "closed", closedAt: new Date(), closedBy: interaction.user.username })
      .where(eq(ticketsTable.id, ticket[0].id));

    const closeEmbed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle("🔒 Ticket Fechado")
      .setDescription(`Fechado por ${interaction.user}`)
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`ticket:reopen:${ticket[0].id}`).setLabel("Reabrir").setStyle(ButtonStyle.Secondary).setEmoji("🔓"),
      new ButtonBuilder().setCustomId(`ticket:delete:${ticket[0].id}`).setLabel("Deletar Canal").setStyle(ButtonStyle.Danger).setEmoji("🗑️"),
    );

    await interaction.reply({ embeds: [closeEmbed], components: [row] });
  } else if (sub === "reabrir") {
    await db.update(ticketsTable).set({ status: "open", closedAt: null, closedBy: null }).where(eq(ticketsTable.id, ticket[0].id));
    await interaction.reply({ embeds: [successEmbed("Ticket reaberto", `Reaberto por ${interaction.user}`)] });
  }
}

export async function handleOpenTicket(interaction: ButtonInteraction): Promise<void> {
  const guild = interaction.guild!;
  const user = interaction.user;

  // Check if user already has an open ticket
  const existing = await db
    .select()
    .from(ticketsTable)
    .where(and(eq(ticketsTable.discordId, user.id), eq(ticketsTable.status, "open")))
    .limit(1);

  if (existing[0] && existing[0].channelId) {
    const ch = guild.channels.cache.get(existing[0].channelId);
    await interaction.reply({
      embeds: [errorEmbed("Já existe um ticket", ch ? `Você já tem um ticket aberto: <#${existing[0].channelId}>` : "Você já tem um ticket aberto.")],
      ephemeral: true,
    });
    return;
  }

  const config = await getConfig(guild.id);

  try {
    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      parent: config?.ticketCategoryId ?? undefined,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
      ],
    });

    const ticket = await db
      .insert(ticketsTable)
      .values({
        discordId: user.id,
        username: user.username,
        category: "Suporte Geral",
        channelId: ticketChannel.id,
        status: "open",
      })
      .returning();

    const embed = ticketEmbed(user.username, "Suporte Geral");
    embed.setDescription(`Olá ${user}! Descreva seu problema e aguarde atendimento.\n\nUse \`/ticket fechar\` para encerrar.`);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`ticket:close_btn:${ticket[0].id}`).setLabel("Fechar Ticket").setStyle(ButtonStyle.Danger).setEmoji("🔒"),
    );

    await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [row] });

    await interaction.reply({ content: `✅ Ticket criado: <#${ticketChannel.id}>`, ephemeral: true });
  } catch (err) {
    logger.error({ err }, "Failed to create ticket channel");
    await interaction.reply({ embeds: [errorEmbed("Erro", "Não foi possível criar o ticket. Verifique as permissões do bot.")], ephemeral: true });
  }
}

export async function handleCloseTicketBtn(interaction: ButtonInteraction, ticketId: string) {
  await db
    .update(ticketsTable)
    .set({ status: "closed", closedAt: new Date(), closedBy: interaction.user.username })
    .where(eq(ticketsTable.id, ticketId));

  const closeEmbed = new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle("🔒 Ticket Fechado")
    .setDescription(`Fechado por ${interaction.user}`)
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`ticket:reopen:${ticketId}`).setLabel("Reabrir").setStyle(ButtonStyle.Secondary).setEmoji("🔓"),
    new ButtonBuilder().setCustomId(`ticket:delete:${ticketId}`).setLabel("Deletar").setStyle(ButtonStyle.Danger).setEmoji("🗑️"),
  );

  await interaction.reply({ embeds: [closeEmbed], components: [row] });
}

export async function handleReopenTicket(interaction: ButtonInteraction, ticketId: string) {
  await db.update(ticketsTable).set({ status: "open", closedAt: null, closedBy: null }).where(eq(ticketsTable.id, ticketId));
  await interaction.reply({ embeds: [successEmbed("Ticket reaberto")] });
}

export async function handleDeleteTicket(interaction: ButtonInteraction) {
  const channel = interaction.channel as TextChannel;
  await interaction.reply({ content: "Deletando canal em 5 segundos..." });
  setTimeout(() => channel.delete().catch(() => {}), 5000);
}
