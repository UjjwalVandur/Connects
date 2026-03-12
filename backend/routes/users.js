import express from "express";
import {
  getUser,
  getUserFriends,
  addRemoveFriend,
  searchUsers,
  updateSocialProfiles,
  updateAdvert,
  deleteAdvert,
  getRandomAd,
  incrementViewedProfile,
  getPostCount,
  updateProfilePicture,
} from "../controllers/users.js";
import verifyToken from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// ── Static routes FIRST (before any dynamic :param routes) ───
router.get("/search",           verifyToken, searchUsers);
router.get("/advert/random",    verifyToken, getRandomAd);

// ── Own-profile routes with static second segment ────────────
router.patch("/:id/picture",    verifyToken, upload.single("picture"), updateProfilePicture);
router.patch("/:id/socials",    verifyToken, updateSocialProfiles);
router.patch("/:id/view",       verifyToken, incrementViewedProfile);
router.get("/:id/post-count",   verifyToken, getPostCount);
router.patch("/:id/advert",     verifyToken, upload.single("media"), updateAdvert);
router.delete("/:id/advert",    verifyToken, deleteAdvert);

// ── Dynamic routes LAST ───────────────────────────────────────
router.get("/:id",              verifyToken, getUser);
router.get("/:id/friends",      verifyToken, getUserFriends);
router.patch("/:id/:friendId",  verifyToken, addRemoveFriend);

export default router;
