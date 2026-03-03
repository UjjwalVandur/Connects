import express from "express";
import { getMessages, sendMessage } from "../controllers/messages.js";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

router.get("/:friendId",  verifyToken, getMessages);
router.post("/:friendId", verifyToken, sendMessage);

export default router;
