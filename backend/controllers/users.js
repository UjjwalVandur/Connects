import User from "../models/User.js";
import Post from "../models/Post.js";

/* ── PATCH /users/:id/picture ─── update profile picture ────── */
export const updateProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id !== id) return res.status(403).json({ message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const picturePath = req.file.path; // Cloudinary returns full HTTPS URL in .path
    const user = await User.findByIdAndUpdate(
      id,
      { picturePath },
      { new: true }
    ).select("-password");
    res.status(200).json({ picturePath: user.picturePath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const formatUsers = async (userIds) => {
      const users = await Promise.all(
        userIds.map((uid) => User.findById(uid).select("-password"))
      );
      return users.filter(Boolean).map(
        ({ _id, firstName, lastName, occupation, location, picturePath }) => ({
          _id, firstName, lastName, occupation, location, picturePath,
        })
      );
    };

    const formattedFriends = await formatUsers(user.friends);
    const formattedRequests = await formatUsers(user.friendRequests);
    const formattedSent = await formatUsers(user.sentFriendRequests);

    res.status(200).json({
      friends: formattedFriends,
      friendRequests: formattedRequests,
      sentFriendRequests: formattedSent
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PATCH /users/:id/:friendId ─── Send/Cancel Request or Remove Friend ── */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    if (id === friendId)
      return res.status(400).json({ message: "Cannot friend yourself" });

    const user   = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend)
      return res.status(404).json({ message: "User not found" });

    const isFriend = user.friends.includes(friendId);
    const hasSentRequest = user.sentFriendRequests.includes(friendId);
    const hasReceivedRequest = user.friendRequests.includes(friendId);

    if (isFriend) {
      // Remove friend
      user.friends = user.friends.filter((fid) => fid !== friendId);
      friend.friends = friend.friends.filter((fid) => fid !== id);
    } else if (hasSentRequest) {
      // Cancel request
      user.sentFriendRequests = user.sentFriendRequests.filter((fid) => fid !== friendId);
      friend.friendRequests = friend.friendRequests.filter((fid) => fid !== id);
    } else if (hasReceivedRequest) {
      // Accept request (shortcut)
      user.friendRequests = user.friendRequests.filter((fid) => fid !== friendId);
      friend.sentFriendRequests = friend.sentFriendRequests.filter((fid) => fid !== id);
      user.friends.push(friendId);
      friend.friends.push(id);
    } else {
      // Send request
      user.sentFriendRequests.push(friendId);
      friend.friendRequests.push(id);
    }

    await user.save();
    await friend.save();

    const formatUsers = async (userIds) => {
      const users = await Promise.all(
        userIds.map((uid) => User.findById(uid).select("-password"))
      );
      return users.filter(Boolean).map(
        ({ _id, firstName, lastName, occupation, location, picturePath }) => ({
          _id, firstName, lastName, occupation, location, picturePath,
        })
      );
    };

    res.status(200).json({
      friends: await formatUsers(user.friends),
      friendRequests: await formatUsers(user.friendRequests),
      sentFriendRequests: await formatUsers(user.sentFriendRequests)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PATCH /users/:id/:friendId/accept ─── Accept Friend Request ── */
export const acceptFriendRequest = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    if (req.user.id !== id) return res.status(403).json({ message: "Unauthorized" });

    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend)
      return res.status(404).json({ message: "User not found" });

    if (user.friendRequests.includes(friendId)) {
      user.friendRequests = user.friendRequests.filter((fid) => fid !== friendId);
      friend.sentFriendRequests = friend.sentFriendRequests.filter((fid) => fid !== id);
      
      if (!user.friends.includes(friendId)) {
        user.friends.push(friendId);
        friend.friends.push(id);
      }
      
      await user.save();
      await friend.save();
    }

    const formatUsers = async (userIds) => {
      const users = await Promise.all(
        userIds.map((uid) => User.findById(uid).select("-password"))
      );
      return users.filter(Boolean).map(
        ({ _id, firstName, lastName, occupation, location, picturePath }) => ({
          _id, firstName, lastName, occupation, location, picturePath,
        })
      );
    };

    res.status(200).json({
      friends: await formatUsers(user.friends),
      friendRequests: await formatUsers(user.friendRequests),
      sentFriendRequests: await formatUsers(user.sentFriendRequests)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PATCH /users/:id/:friendId/reject ─── Reject Friend Request ── */
export const rejectFriendRequest = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    if (req.user.id !== id) return res.status(403).json({ message: "Unauthorized" });

    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend)
      return res.status(404).json({ message: "User not found" });

    if (user.friendRequests.includes(friendId)) {
      user.friendRequests = user.friendRequests.filter((fid) => fid !== friendId);
      friend.sentFriendRequests = friend.sentFriendRequests.filter((fid) => fid !== id);
      
      await user.save();
      await friend.save();
    }

    const formatUsers = async (userIds) => {
      const users = await Promise.all(
        userIds.map((uid) => User.findById(uid).select("-password"))
      );
      return users.filter(Boolean).map(
        ({ _id, firstName, lastName, occupation, location, picturePath }) => ({
          _id, firstName, lastName, occupation, location, picturePath,
        })
      );
    };

    res.status(200).json({
      friends: await formatUsers(user.friends),
      friendRequests: await formatUsers(user.friendRequests),
      sentFriendRequests: await formatUsers(user.sentFriendRequests)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
    const mediaPath = req.file ? req.file.path : req.body.mediaPath || ""; // Cloudinary URL
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

/* ── PATCH /users/:id/view ─── increment profile view count ─── */
export const incrementViewedProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = req.user.id;
    // Don't count own visits
    if (viewerId === id) return res.status(200).json({ message: "own visit" });
    const user = await User.findByIdAndUpdate(
      id,
      { $inc: { viewedProfile: 1 } },
      { new: true }
    ).select("viewedProfile");
    res.status(200).json({ viewedProfile: user.viewedProfile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /users/:id/post-count ─── total posts by user ──────── */
export const getPostCount = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await Post.countDocuments({ userId: id });
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PATCH /users/:id/savePost/:postId ─── Toggle Saved Post ── */
export const toggleSavedPost = async (req, res) => {
  try {
    const { id, postId } = req.params;
    if (req.user.id !== id) return res.status(403).json({ message: "Unauthorized" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isSaved = user.savedPosts.includes(postId);

    if (isSaved) {
      user.savedPosts = user.savedPosts.filter((savedId) => savedId !== postId);
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();

    res.status(200).json({ savedPosts: user.savedPosts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /users/:id/savedPosts ─── Get all saved posts ──────── */
export const getSavedPosts = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id !== id) return res.status(403).json({ message: "Unauthorized" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch the actual post documents using the saved IDs
    const savedPosts = await Post.find({
      _id: { $in: user.savedPosts }
    }).sort({ createdAt: -1 });

    res.status(200).json(savedPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
