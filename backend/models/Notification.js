import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId:    { type: String, required: true },
    senderId:       { type: String, required: true },
    senderName:     { type: String, required: true },
    senderPicture:  { type: String, default: "" },
    type:           { type: String, enum: ["like", "comment", "friend"], required: true },
    postId:         { type: String, default: "" },
    message:        { type: String, default: "" },
    read:           { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
