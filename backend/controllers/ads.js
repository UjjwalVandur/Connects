import Ad from "../models/Ad.js";
import User from "../models/User.js";

/* ── POST /ads ── create a new ad (always appends, never overwrites) ── */
export const createAd = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, link } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "Title is required" });

    const user = await User.findById(userId).select("firstName lastName picturePath");
    if (!user) return res.status(404).json({ message: "User not found" });

    const mediaPath = req.file ? req.file.originalname : "";
    const mediaType = req.file
      ? req.file.mimetype.startsWith("video") ? "video" : "image"
      : "image";

    const ad = new Ad({
      userId,
      firstName:   user.firstName,
      lastName:    user.lastName,
      picturePath: user.picturePath,
      title:       title.trim(),
      description: description || "",
      link:        link || "",
      mediaPath,
      mediaType,
    });
    await ad.save();
    res.status(201).json(ad);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /ads/random ── pick one random ad for the sidebar ──── */
export const getRandomAd = async (req, res) => {
  try {
    const count = await Ad.countDocuments();
    if (count === 0) return res.status(200).json([]);
    // Fetch up to 5 random ads to populate the carousel
    const ads = await Ad.aggregate([{ $sample: { size: 5 } }]);
    res.status(200).json(ads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /ads/mine ── all ads by the logged-in user ─────────── */
export const getMyAds = async (req, res) => {
  try {
    const ads = await Ad.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(ads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── DELETE /ads/:adId ── delete a specific ad ──────────────── */
export const deleteAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const ad = await Ad.findById(adId);
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    if (String(ad.userId) !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });
    await Ad.findByIdAndDelete(adId);
    res.status(200).json({ message: "Ad deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
