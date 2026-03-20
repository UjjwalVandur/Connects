import express from "express";
import { getMessages, sendMessage, getUnreadCount, markAllAsRead } from "../controllers/messages.js";
import verifyToken from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/unread-count", verifyToken, getUnreadCount);
router.patch("/read",       verifyToken, markAllAsRead);

router.get("/:friendId",  verifyToken, getMessages);
// upload.single("media") handles both text-only and media messages
router.post("/:friendId", verifyToken, upload.single("media"), sendMessage);

export default router;
