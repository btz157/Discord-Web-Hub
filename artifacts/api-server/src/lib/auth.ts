import { pool } from "@workspace/db";
import type { Request, Response } from "express";

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
  // Render sets RENDER_EXTERNAL_URL automatically (e.g. https://ws-store-bot.onrender.com)
  if (process.env.RENDER_EXTERNAL_URL) {
    return `${process.env.RENDER_EXTERNAL_URL}/api/auth/callback`;
  }
  // Replit sets REPLIT_DOMAINS (comma-separated, first is the primary domain)
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(",")[0]}/api/auth/callback`;
  }
  // Manual override (useful for any other host)
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

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Failed to fetch Discord user");
  return res.json() as Promise<DiscordUser>;
}

export async function isGuildMember(accessToken: string, guildId: string): Promise<boolean> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return false;
  const guilds = await res.json() as Array<{ id: string }>;
  return guilds.some((g) => g.id === guildId);
}
