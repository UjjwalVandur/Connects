import Post from "../models/Post.js";
import User from "../models/User.js";
import { createNotification } from "./notifications.js";

/* ── POST /posts  (create post) ─────────────────────────── */
export const createPost = async (req, res) => {
  const { userId, description } = req.body;

  // Security: ensure the user can only post as themselves
  if (req.user.id !== userId) {
    return res.status(403).json({ message: "You can only create posts for your own account." });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  // req.file.path is the full Cloudinary HTTPS URL (set by multer-storage-cloudinary)
  const cloudinaryUrl = req.file ? req.file.path : "";
  const isVideo = req.file && req.file.mimetype.startsWith("video");

  const newPost = new Post({
    userId,
    firstName:       user.firstName,
    lastName:        user.lastName,
    location:        user.location,
    description,
    userPicturePath: user.picturePath,
    picturePath:     !isVideo ? cloudinaryUrl : "",   // image Cloudinary URL
    videoPath:       isVideo  ? cloudinaryUrl : "",   // video Cloudinary URL
    likes:           {},
    comments:        [],
  });

  await newPost.save();
  // Return feed posts (excluding own) to keep the UI consistent
  const posts = await Post.find({ userId: { $ne: userId } }).sort({ createdAt: -1 });
  res.status(201).json(posts);
};

/* ── GET /posts/feed  (home feed – exclude own posts) ────── */
export const getFeedPosts = async (req, res) => {
  const myId = req.user.id;
  const posts = await Post.find({ userId: { $ne: myId } }).sort({ createdAt: -1 });
  res.status(200).json(posts);
};

/* ── GET /posts/:userId/posts  (user posts) ─────────────── */
export const getUserPosts = async (req, res) => {
  const { userId } = req.params;
  const posts = await Post.find({ userId }).sort({ createdAt: -1 });
  res.status(200).json(posts);
};

/* ── PATCH /posts/:id/like ──────────────────────────────── */
export const likePost = async (req, res) => {
  const { id }     = req.params;
  const { userId } = req.body;

  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const liked = !post.likes.get(userId);

  if (post.likes.get(userId)) {
    post.likes.delete(userId);
  } else {
    post.likes.set(userId, true);
  }

  const updatedPost = await Post.findByIdAndUpdate(
    id,
    { likes: post.likes },
    { new: true }
  );

  // Send notification when liking (not on unlike)
  if (liked && post.userId !== userId) {
    const liker = await User.findById(userId).select("firstName lastName picturePath");
    if (liker) {
      const io = req.app.get("io");
      await createNotification({
        io,
        recipientId:   post.userId,
        senderId:      userId,
        senderName:    `${liker.firstName} ${liker.lastName}`,
        senderPicture: liker.picturePath,
        type:          "like",
        postId:        id,
        message:       "liked your post",
      });
    }
  }

  res.status(200).json(updatedPost);
};

/* ── PATCH /posts/:id/comment ───────────────────────────── */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    // Look up the user who is posting the comment from the token
    const userId = req.user.id;
    const user = await User.findById(userId).select("firstName lastName picturePath");
    const authorName = user ? `${user.firstName} ${user.lastName}` : "User";

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Store comment as "Name::text"
    post.comments.push(`${authorName}::${comment}`);
    
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { comments: post.comments },
      { new: true }
    );

    // Send notification to post owner (not if commenting on self)
    if (post.userId !== userId) {
      const io = req.app.get("io");
      await createNotification({
        io,
        recipientId:   post.userId,
        senderId:      userId,
        senderName:    authorName,
        senderPicture: user?.picturePath || "",
        type:          "comment",
        postId:        id,
        message:       `commented: "${comment.substring(0, 40)}${comment.length > 40 ? "..." : ""}"`,
      });
    }

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
