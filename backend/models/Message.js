import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId:   { type: String, required: true },
    receiverId: { type: String, required: true },
    text:       { type: String, default: "" },
    mediaPath:  { type: String, default: "" },  // uploaded file name
    mediaType:  { type: String, default: "" },  // "image" | "audio" | "file"
    fileName:   { type: String, default: "" },  // original file display name
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
