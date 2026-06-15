import type { Request } from "express";
import { getDiscordClient } from "./discord-client";
import { logger } from "./logger";

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email: string | null;
  globalName: string | null;
}

declare module "express-session" {
  interface SessionData {
    user?: DiscordUser;
    returnTo?: string;
  }
}

const DISCORD_API = "https://discord.com/api/v10";

export function getRedirectUri(): string {
  // Render sets this automatically (e.g. https://ws-store-bot.onrender.com)
  if (process.env.RENDER_EXTERNAL_URL) {
    return `${process.env.RENDER_EXTERNAL_URL}/api/auth/callback`;
  }
  // Replit sets REPLIT_DOMAINS (comma-separated, first is the primary domain)
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(",")[0]}/api/auth/callback`;
  }
  // Manual override
  if (process.env.APP_URL) {
    return `${process.env.APP_URL}/api/auth/callback`;
  }
  return `http://localhost:80/api/auth/callback`;
}

export async function exchangeCode(code: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Failed to fetch Discord user");
  return res.json() as Promise<DiscordUser>;
}

/**
 * Checks guild membership using the bot client directly — much more reliable
 * than checking via the user's OAuth token (which can miss servers due to pagination).
 * Falls back to allowing access if DISCORD_GUILD_ID is not set or bot is not ready.
 */
export async function isGuildMember(userId: string): Promise<boolean> {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) return true; // no guild restriction configured

  try {
    const client = getDiscordClient();
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return true; // bot not in guild, allow through

    const member = await guild.members.fetch(userId).catch(() => null);
    return member !== null;
  } catch (err) {
    logger.warn({ err, userId }, "isGuildMember check failed — allowing through");
    return true; // fail open: let the user in if check errors
  }
}
