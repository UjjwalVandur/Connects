import Message from "../models/Message.js";
import path from "path";

const getMediaType = (mimetype = "") => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("audio/")) return "audio";
  if (mimetype.startsWith("video/")) return "video";
  return "file";
};

/* ── GET /messages/unread-count ── count unread messages ────── */
export const getUnreadCount = async (req, res) => {
  try {
    const myId = req.user.id;
    const count = await Message.countDocuments({ receiverId: myId, read: false });
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PATCH /messages/read ── mark all messages as read ──────── */
export const markAllAsRead = async (req, res) => {
  try {
    const myId = req.user.id;
    await Message.updateMany(
      { receiverId: myId, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: "Messages marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /messages/:friendId ── conversation history ───────── */
export const getMessages = async (req, res) => {
  try {
    const myId = req.user.id;
    const { friendId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: myId,     receiverId: friendId },
        { senderId: friendId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /messages/:friendId ── send message (text or media) ─ */
export const sendMessage = async (req, res) => {
  try {
    const myId = req.user.id;
    const { friendId } = req.params;
    const { text } = req.body;

    const hasMedia = !!req.file;
    const hasText  = text && text.trim();

    if (!hasText && !hasMedia) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const message = new Message({
      senderId:   myId,
      receiverId: friendId,
      text:       hasText ? text.trim() : "",
      mediaPath:  hasMedia ? req.file.originalname : "",
      mediaType:  hasMedia ? getMediaType(req.file.mimetype) : "",
      fileName:   hasMedia ? req.file.originalname : "",
    });
    await message.save();

    // Emit via socket
    const io = req.app.get("io");
    if (io) io.to(friendId).emit("receiveMessage", message);

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
