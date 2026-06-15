import type { Interaction } from "discord.js";
import { handleWarn, handleWarns, handleClearwarn } from "../commands/moderation";
import { handleTicketSetup, handleTicketCommand, handleOpenTicket, handleCloseTicketBtn, handleReopenTicket, handleDeleteTicket } from "../commands/ticket";
import { handleSorteio, handleParticipar } from "../commands/sorteio";
import { handleXp } from "../commands/xp";
import { handleAnuncio } from "../commands/anuncio";
import { handleCargos, handleCargoSelect } from "../commands/cargos";
import { logger } from "../../lib/logger";

export async function handleInteractionCreate(interaction: Interaction) {
  try {
    // ── Slash commands ──────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {
        case "warn":         return await handleWarn(interaction);
        case "warns":        return await handleWarns(interaction);
        case "clearwarn":    return await handleClearwarn(interaction);
        case "ticket-setup": return await handleTicketSetup(interaction);
        case "ticket":       return await handleTicketCommand(interaction);
        case "sorteio":      return await handleSorteio(interaction);
        case "xp":           return await handleXp(interaction);
        case "anuncio":      return await handleAnuncio(interaction);
        case "cargos":       return await handleCargos(interaction);
        default:
          logger.warn({ cmd: interaction.commandName }, "Unknown command");
      }
      return;
    }

    // ── Button interactions ─────────────────────────────────────────
    if (interaction.isButton()) {
      const [ns, action, id] = interaction.customId.split(":");

      if (ns === "ticket") {
        if (action === "open")       return await handleOpenTicket(interaction);
        if (action === "close_btn")  return await handleCloseTicketBtn(interaction, id);
        if (action === "reopen")     return await handleReopenTicket(interaction, id);
        if (action === "delete")     return await handleDeleteTicket(interaction);
      }

      if (ns === "sorteio" && action === "participar") {
        return await handleParticipar(interaction, id);
      }
      return;
    }

    // ── Select menus ────────────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "cargos:selecionar") {
        return await handleCargoSelect(interaction);
      }
      return;
    }
  } catch (err) {
    logger.error({ err, customId: (interaction as any).customId, cmd: (interaction as any).commandName }, "Interaction error");
    try {
      const reply = { content: "❌ Ocorreu um erro ao processar esta interação.", ephemeral: true };
      if ((interaction as any).replied || (interaction as any).deferred) {
        await (interaction as any).followUp(reply);
      } else {
        await (interaction as any).reply(reply);
      }
    } catch {}
  }
}
