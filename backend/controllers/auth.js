import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";

/* ── helpers ─────────────────────────────────────────────── */
const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

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

/* ── Forgot Password ─────────────────────────────────────── */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await User.findOne({ email });
  // Always respond 200 to prevent user enumeration
  if (!user) return res.status(200).json({ message: "If that email exists, a reset link has been sent." });

  // Generate a secure random token (raw) and hash it for storage
  const rawToken    = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.resetPasswordToken   = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from:    `"Connects App" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: "Reset your Connects password",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0a0a12;border-radius:16px;color:#fff">
          <h2 style="background:linear-gradient(90deg,#00e5ff,#0077ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:1.6rem;margin-bottom:8px">
            ✦ Connects
          </h2>
          <h3 style="color:#fff;margin-bottom:16px">Password Reset Request</h3>
          <p style="color:rgba(255,255,255,0.6);line-height:1.6">
            We received a request to reset the password for your account (<strong style="color:#fff">${email}</strong>).
            Click the button below to set a new password. This link is valid for <strong>1 hour</strong> and any
            previous reset link is no longer valid.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;margin:24px 0;padding:14px 32px;background:linear-gradient(135deg,#00e5ff,#0077ff);color:#000;font-weight:700;border-radius:999px;text-decoration:none;font-size:0.95rem">
            Reset Password →
          </a>
          <p style="color:rgba(255,255,255,0.35);font-size:0.8rem;margin-top:24px">
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0">
          <p style="color:rgba(255,255,255,0.25);font-size:0.75rem">
            Connects v2.0.0 — This is an automated email, please do not reply.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Email] Failed to send reset email:", err.message);
    // Don't expose email errors to the client
  }

  res.status(200).json({ message: "If that email exists, a reset link has been sent." });
};

/* ── Reset Password ──────────────────────────────────────── */
export const resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body;
  if (!token || !email || !newPassword)
    return res.status(400).json({ message: "Token, email and new password are required." });

  if (newPassword.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters." });

  // Hash the raw token from the URL and match against stored hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    email,
    resetPasswordToken:   hashedToken,
    resetPasswordExpires: { $gt: new Date() }, // not expired
  });

  if (!user) return res.status(400).json({ message: "Reset link is invalid or has expired. Please request a new one." });

  const salt = await bcrypt.genSalt();
  user.password             = await bcrypt.hash(newPassword, salt);
  user.resetPasswordToken   = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.status(200).json({ message: "Password reset successfully! You can now log in." });
};

