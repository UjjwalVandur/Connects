import express from "express";
import { getNotifications, markAllRead } from "../controllers/notifications.js";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

router.get("/",         verifyToken, getNotifications);
router.patch("/read",   verifyToken, markAllRead);

export default router;
