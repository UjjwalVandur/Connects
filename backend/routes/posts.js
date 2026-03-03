import express from "express";
import { createPost, getFeedPosts, getUserPosts, likePost, addComment } from "../controllers/posts.js";
import verifyToken from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/feed",            verifyToken, getFeedPosts);   // home feed (excludes own)
router.get("/",                verifyToken, getFeedPosts);   // legacy
router.get("/:userId/posts",   verifyToken, getUserPosts);
router.post("/",               verifyToken, upload.single("picture"), createPost);
router.patch("/:id/like",      verifyToken, likePost);
router.patch("/:id/comment",   verifyToken, addComment);

export default router;
