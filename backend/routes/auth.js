import express from "express";
import { login, register, forgotPassword, resetPassword } from "../controllers/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/register",        upload.single("picture"), register);
router.post("/login",           login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password",  resetPassword);

export default router;
