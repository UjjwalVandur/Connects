import Message from "../models/Message.js";

/* ── GET /messages/:friendId ──── get conversation */
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

/* ── POST /messages/:friendId ──── send a message */
export const sendMessage = async (req, res) => {
  try {
    const myId = req.user.id;
    const { friendId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) return res.status(400).json({ message: "Message cannot be empty" });

    const message = new Message({ senderId: myId, receiverId: friendId, text });
    await message.save();

    // Emit via socket (io is attached to req.app)
    const io = req.app.get("io");
    if (io) {
      io.to(friendId).emit("receiveMessage", message);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
