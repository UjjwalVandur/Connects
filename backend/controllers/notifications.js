import Notification from "../models/Notification.js";

/* ── GET /notifications ──── get current user's notifications */
export const getNotifications = async (req, res) => {
  try {
    const myId = req.user.id;
    const notifications = await Notification.find({ recipientId: myId })
      .sort({ createdAt: -1 })
      .limit(30);
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PATCH /notifications/read ──── mark all as read */
export const markAllRead = async (req, res) => {
  try {
    const myId = req.user.id;
    await Notification.updateMany({ recipientId: myId, read: false }, { read: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── Helper used by posts/users controllers ──── */
export const createNotification = async ({ io, recipientId, senderId, senderName, senderPicture, type, postId, message }) => {
  if (recipientId === senderId) return; // don't notify yourself
  try {
    const notif = new Notification({ recipientId, senderId, senderName, senderPicture, type, postId: postId || "", message: message || "" });
    await notif.save();
    if (io) io.to(recipientId).emit("newNotification", notif);
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};
