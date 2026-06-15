import { Client, GatewayIntentBits } from "discord.js";
import { logger } from "./logger";
import { setupBotEvents } from "../bot/index";

let _client: Client | null = null;
let _ready = false;

export function getDiscordClient(): Client {
  if (_client) return _client;

  _client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildPresences,
    ],
  });

  _client.once("clientReady", (c) => {
    _ready = true;
    logger.info({ tag: c.user.tag, guilds: c.guilds.cache.size }, "Discord bot ready");
  });

  _client.on("error", (err) => {
    logger.error({ err }, "Discord client error");
  });

  // Register all bot events (commands, XP, tickets, etc.)
  setupBotEvents(_client);

  const token = process.env.DISCORD_TOKEN;
  if (token) {
    _client.login(token).catch((err) => {
      logger.error({ err }, "Failed to login to Discord");
    });
  } else {
    logger.warn("DISCORD_TOKEN not set — bot features disabled");
  }

  return _client;
}

export function isDiscordReady(): boolean {
  return _ready;
}

export async function getGuild() {
  const client = getDiscordClient();
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) return null;
  try {
    return await client.guilds.fetch(guildId);
  } catch {
    return null;
  }
}
