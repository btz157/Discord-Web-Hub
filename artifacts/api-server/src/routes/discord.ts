import { Router, type IRouter } from "express";
import { ChannelType } from "discord.js";
import { getGuild, isDiscordReady } from "../lib/discord-client";

const router: IRouter = Router();

const CHANNEL_TYPES: Record<number, string> = {
  0: "text",
  2: "voice",
  4: "category",
  5: "announcement",
  13: "stage",
  15: "forum",
};

router.get("/discord/channels", async (_req, res): Promise<void> => {
  const guild = await getGuild();

  if (!guild) {
    res.json([]);
    return;
  }

  const channels = await guild.channels.fetch();
  const result = channels
    .filter((c) => c !== null)
    .map((c) => {
      const typeName = CHANNEL_TYPES[c!.type] ?? "unknown";
      const parent = "parentId" in c! && c!.parentId
        ? channels.get(c!.parentId)
        : null;
      return {
        id: c!.id,
        name: c!.name,
        type: typeName,
        position: "position" in c! ? (c!.position as number) : 0,
        parentId: "parentId" in c! ? (c!.parentId ?? null) : null,
        parentName: parent ? parent.name : null,
      };
    })
    .sort((a, b) => a.position - b.position);

  res.json(result);
});

router.get("/discord/roles", async (_req, res): Promise<void> => {
  const guild = await getGuild();

  if (!guild) {
    res.json([]);
    return;
  }

  const roles = await guild.roles.fetch();
  const result = roles
    .filter((r) => r.name !== "@everyone")
    .map((r) => ({
      id: r.id,
      name: r.name,
      color: r.hexColor,
      position: r.position,
      managed: r.managed,
    }))
    .sort((a, b) => b.position - a.position);

  res.json(result);
});

router.get("/discord/members", async (req, res): Promise<void> => {
  const guild = await getGuild();

  if (!guild) {
    res.json([]);
    return;
  }

  const limit = Math.min(parseInt(String(req.query.limit ?? "100")) || 100, 1000);

  const members = await guild.members.list({ limit });
  const result = members.map((m) => ({
    id: m.id,
    username: m.user.username,
    displayName: m.displayName !== m.user.username ? m.displayName : null,
    avatarUrl: m.displayAvatarURL({ size: 64 }) ?? null,
    roles: m.roles.cache.map((r) => r.id),
  }));

  res.json(result);
});

export default router;
