import { EmbedBuilder, Colors } from "discord.js";

const BLUE = 0x3b82f6;
const GREEN = 0x22c55e;
const RED = 0xef4444;
const YELLOW = 0xeab308;
const PURPLE = 0xa855f7;

export function successEmbed(title: string, description?: string) {
  return new EmbedBuilder().setColor(GREEN).setTitle(`✅ ${title}`).setDescription(description ?? null);
}

export function errorEmbed(title: string, description?: string) {
  return new EmbedBuilder().setColor(RED).setTitle(`❌ ${title}`).setDescription(description ?? null);
}

export function infoEmbed(title: string, description?: string) {
  return new EmbedBuilder().setColor(BLUE).setTitle(title).setDescription(description ?? null);
}

export function warnEmbed(title: string, description?: string) {
  return new EmbedBuilder().setColor(YELLOW).setTitle(`⚠️ ${title}`).setDescription(description ?? null);
}

export function xpEmbed(username: string, xp: number, level: number, avatarUrl?: string | null) {
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle(`⚡ XP de ${username}`)
    .addFields(
      { name: "Nível", value: `**${level}**`, inline: true },
      { name: "XP Total", value: `**${xp}**`, inline: true },
    );
  if (avatarUrl) embed.setThumbnail(avatarUrl);
  return embed;
}

export function sorteioEmbed(prize: string, description: string | null | undefined, endAt: Date, winners: number, participants: number, createdBy: string) {
  return new EmbedBuilder()
    .setColor(YELLOW)
    .setTitle(`🎉 SORTEIO — ${prize}`)
    .setDescription(description ?? null)
    .addFields(
      { name: "🏆 Ganhadores", value: `${winners}`, inline: true },
      { name: "👥 Participantes", value: `${participants}`, inline: true },
      { name: "⏰ Termina em", value: `<t:${Math.floor(endAt.getTime() / 1000)}:R>`, inline: true },
    )
    .setFooter({ text: `Criado por ${createdBy}` })
    .setTimestamp();
}

export function ticketEmbed(username: string, category: string, subject?: string | null) {
  return new EmbedBuilder()
    .setColor(BLUE)
    .setTitle(`🎫 Ticket de ${username}`)
    .setDescription(subject ?? "Sem assunto informado.")
    .addFields({ name: "Categoria", value: category, inline: true })
    .setTimestamp();
}
