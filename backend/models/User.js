import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName:   { type: String, required: true, min: 2, max: 50 },
    lastName:    { type: String, required: true, min: 2, max: 50 },
    email:       { type: String, required: true, unique: true, max: 50 },
    password:    { type: String, required: true, min: 5 },
    picturePath: { type: String, default: "" },
    friends:     { type: Array,  default: [] },
    friendRequests: { type: Array, default: [] },
    sentFriendRequests: { type: Array, default: [] },
    savedPosts:  { type: Array,  default: [] },
    location:    String,
    occupation:  String,
    viewedProfile: Number,
    impressions:   Number,
    socialProfiles: {
      type: [
        {
          platform: String,
          socialLink: String
        }
      ],
      default: []
    },
    advert: {
      title: String,
      description: String,
      link: String,
      mediaPath: String
    },
    resetPasswordToken:   { type: String,  default: null },
    resetPasswordExpires: { type: Date,    default: null },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
