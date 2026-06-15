import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { errorEmbed, successEmbed } from "../utils/embeds";

const COLORS: Record<string, number> = {
  azul: 0x3b82f6,
  verde: 0x22c55e,
  vermelho: 0xef4444,
  amarelo: 0xeab308,
  roxo: 0xa855f7,
};

export const anuncioCommand = new SlashCommandBuilder()
  .setName("anuncio")
  .setDescription("Enviar um anúncio em um canal")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption((o) => o.setName("canal").setDescription("Canal para enviar").setRequired(true))
  .addStringOption((o) => o.setName("titulo").setDescription("Título do anúncio").setRequired(true))
  .addStringOption((o) => o.setName("mensagem").setDescription("Conteúdo do anúncio").setRequired(true))
  .addStringOption((o) =>
    o
      .setName("cor")
      .setDescription("Cor do embed")
      .addChoices(
        { name: "Azul", value: "azul" },
        { name: "Verde", value: "verde" },
        { name: "Vermelho", value: "vermelho" },
        { name: "Amarelo", value: "amarelo" },
        { name: "Roxo", value: "roxo" },
      ),
  )
  .addRoleOption((o) => o.setName("mencao").setDescription("Cargo a mencionar (opcional)"));

export async function handleAnuncio(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel("canal", true) as TextChannel;
  const titulo = interaction.options.getString("titulo", true);
  const mensagem = interaction.options.getString("mensagem", true);
  const cor = interaction.options.getString("cor") ?? "azul";
  const role = interaction.options.getRole("mencao");

  const embed = new EmbedBuilder()
    .setColor(COLORS[cor] ?? 0x3b82f6)
    .setTitle(`📢 ${titulo}`)
    .setDescription(mensagem)
    .setFooter({ text: `Enviado por ${interaction.user.username}` })
    .setTimestamp();

  const content = role ? `${role}` : undefined;

  try {
    await channel.send({ content, embeds: [embed], allowedMentions: { roles: role ? [role.id] : [] } });
    await interaction.reply({ embeds: [successEmbed("Anúncio enviado!", `Enviado em <#${channel.id}>`)], ephemeral: true });
  } catch {
    await interaction.reply({ embeds: [errorEmbed("Erro", "Não foi possível enviar o anúncio. Verifique as permissões.")], ephemeral: true });
  }
}
