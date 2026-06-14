import { Client, GatewayIntentBits, Collection, ChannelType } from "discord.js";
import { logger } from "./logger";

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

  _client.once("ready", (c) => {
    _ready = true;
    logger.info({ tag: c.user.tag, guilds: c.guilds.cache.size }, "Discord bot ready");
  });

  _client.on("error", (err) => {
    logger.error({ err }, "Discord client error");
  });

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
    const guild = await client.guilds.fetch(guildId);
    return guild;
  } catch {
    return null;
  }
}
