import { Router, type IRouter } from "express";
import {
  getRedirectUri,
  exchangeCode,
  fetchDiscordUser,
  isGuildMember,
} from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const SCOPES = ["identify", "email", "guilds"].join("%20");

router.get("/auth/login", (req, res): void => {
  const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "/dashboard";
  req.session.returnTo = returnTo;

  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: "DISCORD_CLIENT_ID not configured" });
    return;
  }

  const redirectUri = encodeURIComponent(getRedirectUri());
  const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${SCOPES}`;
  res.redirect(url);
});

router.get("/auth/callback", async (req, res): Promise<void> => {
  const code = req.query.code as string | undefined;
  if (!code) {
    res.redirect("/?error=missing_code");
    return;
  }

  try {
    const accessToken = await exchangeCode(code);
    const user = await fetchDiscordUser(accessToken);

    const guildId = process.env.DISCORD_GUILD_ID;
    if (guildId) {
      const member = await isGuildMember(accessToken, guildId);
      if (!member) {
        res.redirect("/?error=not_member");
        return;
      }
    }

    req.session.user = user;
    const returnTo = req.session.returnTo ?? "/dashboard";
    delete req.session.returnTo;

    req.session.save((err) => {
      if (err) logger.error({ err }, "Session save error");
      res.redirect(returnTo);
    });
  } catch (err) {
    logger.error({ err }, "OAuth2 callback error");
    res.redirect("/?error=auth_failed");
  }
});

router.get("/auth/me", (req, res): void => {
  if (!req.session?.user) {
    res.status(401).json({ user: null });
    return;
  }
  res.json({ user: req.session.user });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) logger.error({ err }, "Session destroy error");
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

export default router;
