import express from "express";
import { createAd, getRandomAd, getMyAds, deleteAd } from "../controllers/ads.js";
import verifyToken from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/random",  verifyToken, getRandomAd);
router.get("/mine",    verifyToken, getMyAds);
router.post("/",       verifyToken, upload.single("media"), createAd);
router.delete("/:adId",verifyToken, deleteAd);

export default router;
