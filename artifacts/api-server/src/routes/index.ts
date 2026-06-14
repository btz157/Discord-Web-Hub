import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import membersRouter from "./members";
import warnsRouter from "./warns";
import ticketsRouter from "./tickets";
import sorteiosRouter from "./sorteios";
import rolesRouter from "./roles";
import xpRouter from "./xp";
import anunciosRouter from "./anuncios";
import configRouter from "./config";
import logsRouter from "./logs";
import discordRouter from "./discord";

const router: IRouter = Router();

// Auth routes — no protection needed
router.use(healthRouter);
router.use(authRouter);

// Protected routes below
router.use(dashboardRouter);
router.use(membersRouter);
router.use(warnsRouter);
router.use(ticketsRouter);
router.use(sorteiosRouter);
router.use(rolesRouter);
router.use(xpRouter);
router.use(anunciosRouter);
router.use(configRouter);
router.use(logsRouter);
router.use(discordRouter);

export default router;
