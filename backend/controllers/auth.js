import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ── Register ─────────────────────────────────────────────── */
export const register = async (req, res) => {
  const {
    firstName, lastName, email, password,
    picturePath, friends, location, occupation,
  } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already in use" });

  const salt         = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = new User({
    firstName,
    lastName,
    email,
    password: passwordHash,
    picturePath,
    friends,
    location,
    occupation,
    viewedProfile: Math.floor(Math.random() * 10000),
    impressions:   Math.floor(Math.random() * 10000),
  });

  const savedUser = await newUser.save();
  const { password: _, ...safeUser } = savedUser.toObject();
  res.status(201).json(safeUser);
};

/* ── Login ───────────────────────────────────────────────── */
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  const { password: _, ...safeUser } = user.toObject();
  res.status(200).json({ token, user: safeUser });
};
