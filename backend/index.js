/* ─────────────────────────────────────────────────────────────
   index.js  –  Social Media API entry point with Socket.io
   ───────────────────────────────────────────────────────────── */
import "express-async-errors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// ── Routes ────────────────────────────────────────────────────
import authRoutes          from "./routes/auth.js";
import userRoutes          from "./routes/users.js";
import postRoutes          from "./routes/posts.js";
import messageRoutes       from "./routes/messages.js";
import notificationRoutes  from "./routes/notifications.js";
import adRoutes            from "./routes/ads.js";

// ── Config ────────────────────────────────────────────────────
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const {
  PORT       = 3001,
  NODE_ENV   = "development",
  MONGO_URL,
  CORS_ORIGINS = "http://localhost:3000",
} = process.env;

const isDev = NODE_ENV === "development";

// ── App ───────────────────────────────────────────────────────
const app        = express();
const httpServer = createServer(app);

// ── Socket.io ─────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGINS.split(",").map((o) => o.trim()),
    methods: ["GET", "POST"],
  },
});

// Each user joins a room named by their userId
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
    console.log(`[Socket] User ${userId} connected`);
  }

  socket.on("disconnect", () => {
    console.log(`[Socket] User ${userId} disconnected`);
  });
});

// Make io available in controllers via req.app.get("io")
app.set("io", io);

// ── Security & parsing middleware ─────────────────────────────
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan(isDev ? "dev" : "combined"));

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = CORS_ORIGINS.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ── Static file serving (uploaded assets) ────────────────────
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// ── API Routes ────────────────────────────────────────────────
app.use("/auth",          authRoutes);
app.use("/users",         userRoutes);
app.use("/posts",         postRoutes);
app.use("/messages",      messageRoutes);
app.use("/notifications", notificationRoutes);
app.use("/ads",           adRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status  = err.status || 500;
  const message = isDev ? err.message : "Internal server error";
  if (isDev) console.error(err);
  res.status(status).json({ message });
});

// ── Database & server startup ─────────────────────────────────
mongoose
  .connect(MONGO_URL, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`[DB]     Connected to MongoDB`);
    httpServer.listen(PORT, () => {
      console.log(`[Server] Running in ${NODE_ENV} mode on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[DB] Connection error:", err.message);
    process.exit(1);
  });
