import { REST, Routes } from "discord.js";
import type { Client } from "discord.js";
import { handleGuildMemberAdd } from "./events/guildMemberAdd";
import { handleMessageCreate } from "./events/messageCreate";
import { handleInteractionCreate } from "./events/interactionCreate";
import { warnCommand, warnsCommand, clearwarnCommand } from "./commands/moderation";
import { ticketSetupCommand, ticketCommand } from "./commands/ticket";
import { sorteioCommand } from "./commands/sorteio";
import { xpCommand } from "./commands/xp";
import { anuncioCommand } from "./commands/anuncio";
import { cargosCommand } from "./commands/cargos";
import { logger } from "../lib/logger";

const commands = [
  warnCommand,
  warnsCommand,
  clearwarnCommand,
  ticketSetupCommand,
  ticketCommand,
  sorteioCommand,
  xpCommand,
  anuncioCommand,
  cargosCommand,
].map((c) => c.toJSON());

export async function registerCommands(clientId: string, guildId: string, token: string) {
  const rest = new REST().setToken(token);
  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    logger.info({ count: commands.length }, "Slash commands registered");
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
  }
}

export function setupBotEvents(client: Client) {
  client.on("guildMemberAdd", handleGuildMemberAdd);
  client.on("messageCreate", handleMessageCreate);
  client.on("interactionCreate", handleInteractionCreate);

  client.once("clientReady", async (c) => {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (token && clientId && guildId) {
      await registerCommands(clientId, guildId, token);
    } else {
      logger.warn("DISCORD_CLIENT_ID or DISCORD_GUILD_ID not set — skipping command registration");
    }
  });
}
