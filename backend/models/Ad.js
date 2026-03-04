import mongoose from "mongoose";

const adSchema = new mongoose.Schema(
  {
    userId:      { type: String, required: true },
    firstName:   { type: String, required: true },
    lastName:    { type: String, required: true },
    picturePath: { type: String, default: "" },
    title:       { type: String, required: true },
    description: { type: String, default: "" },
    link:        { type: String, default: "" },
    mediaPath:   { type: String, default: "" },
    mediaType:   { type: String, default: "image" }, // "image" | "video"
  },
  { timestamps: true }
);

const Ad = mongoose.model("Ad", adSchema);
export default Ad;
