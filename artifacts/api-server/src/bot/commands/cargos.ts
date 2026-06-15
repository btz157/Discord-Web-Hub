import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  EmbedBuilder,
} from "discord.js";
import { db } from "@workspace/db";
import { rolesTable } from "@workspace/db/schema";
import { successEmbed, errorEmbed } from "../utils/embeds";

export const cargosCommand = new SlashCommandBuilder()
  .setName("cargos")
  .setDescription("Sistema de cargos selecionáveis")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((s) => s.setName("setup").setDescription("Criar painel de cargos no canal atual"));

export async function handleCargos(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();

  if (sub === "setup") {
    const roles = await db.select().from(rolesTable);

    if (roles.length === 0) {
      await interaction.reply({
        embeds: [errorEmbed("Nenhum cargo configurado", "Adicione cargos pelo painel web primeiro.")],
        ephemeral: true,
      });
      return;
    }

    const options = roles.map((r) => ({
      label: r.roleName,
      value: r.roleId,
      description: r.description.slice(0, 100),
      emoji: r.emoji || undefined,
    }));

    const select = new StringSelectMenuBuilder()
      .setCustomId("cargos:selecionar")
      .setPlaceholder("Escolha seus cargos...")
      .setMinValues(0)
      .setMaxValues(Math.min(options.length, 25))
      .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle("🏷️ Cargos Selecionáveis")
      .setDescription("Escolha os cargos que deseja ter no servidor. Selecionar um cargo que já possui irá removê-lo.");

    await interaction.reply({ embeds: [embed], components: [row] });
  }
}

export async function handleCargoSelect(interaction: StringSelectMenuInteraction) {
  const guild = interaction.guild!;
  const member = await guild.members.fetch(interaction.user.id);
  const selected = interaction.values; // roleIds selecionados

  const allRoles = await db.select().from(rolesTable);
  const allRoleIds = allRoles.map((r) => r.roleId);

  const added: string[] = [];
  const removed: string[] = [];
  const errors: string[] = [];

  // Remove roles not selected, add roles selected
  for (const dbRole of allRoles) {
    const hasRole = member.roles.cache.has(dbRole.roleId);
    const wants = selected.includes(dbRole.roleId);
    const guildRole = guild.roles.cache.get(dbRole.roleId);

    if (!guildRole) continue;

    if (wants && !hasRole) {
      await member.roles.add(guildRole).then(() => added.push(dbRole.emoji + " " + dbRole.roleName)).catch(() => errors.push(dbRole.roleName));
    } else if (!wants && hasRole) {
      await member.roles.remove(guildRole).then(() => removed.push(dbRole.emoji + " " + dbRole.roleName)).catch(() => errors.push(dbRole.roleName));
    }
  }

  const lines: string[] = [];
  if (added.length) lines.push(`✅ **Adicionados:** ${added.join(", ")}`);
  if (removed.length) lines.push(`❌ **Removidos:** ${removed.join(", ")}`);
  if (errors.length) lines.push(`⚠️ **Falha:** ${errors.join(", ")}`);
  if (!lines.length) lines.push("Nenhuma alteração.");

  await interaction.reply({ content: lines.join("\n"), ephemeral: true });
}
