import User from "../models/User.js";

/* ── GET /users/search?q=... ─────────────────────────────── */
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") return res.status(200).json([]);

    const parts = q.trim().split(/\s+/); // split "John Doe" into ["John", "Doe"]

    let searchConditions;
    if (parts.length === 1) {
      // Single word: match firstName OR lastName
      searchConditions = [
        { firstName: { $regex: parts[0], $options: "i" } },
        { lastName:  { $regex: parts[0], $options: "i" } },
      ];
    } else {
      // Multiple words (full name): match firstName AND lastName in both orders
      searchConditions = [
        { firstName: { $regex: parts[0], $options: "i" }, lastName: { $regex: parts.slice(1).join(" "), $options: "i" } },
        { firstName: { $regex: parts.slice(1).join(" "), $options: "i" }, lastName: { $regex: parts[0], $options: "i" } },
      ];
    }

    const results = await User.find({ $or: searchConditions })
      .select("_id firstName lastName picturePath occupation")
      .limit(10);

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /users/:id ──────────────────────────────────────── */
export const getUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json(user);
};

/* ── GET /users/:id/friends ──────────────────────────────── */
export const getUserFriends = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const friends = await Promise.all(
    user.friends.map((friendId) =>
      User.findById(friendId).select("-password")
    )
  );

  const formatted = friends.filter(Boolean).map(
    ({ _id, firstName, lastName, occupation, location, picturePath }) => ({
      _id, firstName, lastName, occupation, location, picturePath,
    })
  );

  res.status(200).json(formatted);
};

/* ── PATCH /users/:id/:friendId ─────────────────────────── */
export const addRemoveFriend = async (req, res) => {
  const { id, friendId } = req.params;
  if (id === friendId)
    return res.status(400).json({ message: "Cannot friend yourself" });

  const user   = await User.findById(id);
  const friend = await User.findById(friendId);

  if (!user || !friend)
    return res.status(404).json({ message: "User not found" });

  const isFriend = user.friends.includes(friendId);

  if (isFriend) {
    user.friends   = user.friends.filter((fid) => fid !== friendId);
    friend.friends = friend.friends.filter((fid) => fid !== id);
  } else {
    user.friends.push(friendId);
    friend.friends.push(id);
  }

  await user.save();
  await friend.save();

  const updatedFriends = await Promise.all(
    user.friends.map((fid) => User.findById(fid).select("-password"))
  );

  const formatted = updatedFriends.filter(Boolean).map(
    ({ _id, firstName, lastName, occupation, location, picturePath }) => ({
      _id, firstName, lastName, occupation, location, picturePath,
    })
  );

  res.status(200).json(formatted);
};

/* ── PATCH /users/:id/socials ─── update social profile links ── */
export const updateSocialProfiles = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id !== id) return res.status(403).json({ message: "Unauthorized" });
    const { socialProfiles } = req.body; // array of { platform, socialLink }
    const user = await User.findByIdAndUpdate(
      id,
      { socialProfiles },
      { new: true }
    ).select("-password");
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PATCH /users/:id/advert ─── create/update sponsored ad ─── */
export const updateAdvert = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id !== id) return res.status(403).json({ message: "Unauthorized" });
    const { title, description, link } = req.body;
    const mediaPath = req.file ? req.file.originalname : req.body.mediaPath || "";
    const user = await User.findByIdAndUpdate(
      id,
      { advert: { title, description, link, mediaPath } },
      { new: true }
    ).select("-password");
    res.status(200).json(user.advert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /users/advert/random ─── pick a random active ad ───── */
export const getRandomAd = async (req, res) => {
  try {
    const ads = await User.aggregate([
      { $match: { "advert.title": { $exists: true, $ne: "" } } },
      { $sample: { size: 1 } },
      { $project: { firstName: 1, lastName: 1, picturePath: 1, advert: 1 } },
    ]);
    if (!ads.length) return res.status(200).json(null);
    res.status(200).json(ads[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── DELETE /users/:id/advert ─── remove sponsored ad ──────── */
export const deleteAdvert = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id !== id) return res.status(403).json({ message: "Unauthorized" });
    await User.findByIdAndUpdate(id, {
      $unset: { advert: "" },
    });
    res.status(200).json({ message: "Ad deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
