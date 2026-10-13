import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import os from "os";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import Message from "./models/Message.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/upload", uploadRoutes);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const onlineUsers = new Map(); // username -> socket.id

function broadcastPresence() {
  io.emit("presence:update", Array.from(onlineUsers.keys()));
}

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token provided"));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.username = payload.username;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  onlineUsers.set(socket.username, socket.id);
  broadcastPresence();
  console.log(`${socket.username} connected`);

  socket.on("message:public", async ({ content, mediaUrl, mediaName }) => {
    if (!content?.trim() && !mediaUrl) return;
    try {
      const doc = await Message.create({
        type: "public",
        from: socket.username,
        content: content || "",
        mediaUrl,
        mediaName,
      });
      io.emit("message:public", {
        id: doc._id.toString(),
        username: socket.username,
        content: doc.content,
        mediaUrl: doc.mediaUrl,
        mediaName: doc.mediaName,
        timestamp: doc.timestamp.getTime(),
      });
    } catch (err) {
      console.error("Failed to save public message:", err.message);
    }
  });

  socket.on("message:dm", async ({ toUsername, content, mediaUrl, mediaName }) => {
    if ((!content?.trim() && !mediaUrl) || !toUsername) return;
    try {
      const doc = await Message.create({
        type: "dm",
        from: socket.username,
        to: toUsername,
        content: content || "",
        mediaUrl,
        mediaName,
      });
      const payload = {
        id: doc._id.toString(),
        fromUsername: socket.username,
        toUsername,
        content: doc.content,
        mediaUrl: doc.mediaUrl,
        mediaName: doc.mediaName,
        timestamp: doc.timestamp.getTime(),
      };
      const recipientSocketId = onlineUsers.get(toUsername);
      if (recipientSocketId) io.to(recipientSocketId).emit("message:dm", payload);
      socket.emit("message:dm", payload); // echo to sender
    } catch (err) {
      console.error("Failed to save DM:", err.message);
    }
  });

  // Delete/unsend — single id (quick delete) or a bulk ids array (multi-select).
  // Either way, only the original sender's own messages are ever deleted —
  // anything in the request that isn't theirs is silently dropped, not just skipped client-side.
  socket.on("message:delete", async ({ id, ids }) => {
    const targetIds = (ids && ids.length ? ids : id ? [id] : []).filter(Boolean);
    if (!targetIds.length) return;

    try {
      const msgs = await Message.find({ _id: { $in: targetIds }, from: socket.username });
      if (!msgs.length) return;

      const deletableIds = msgs.map((m) => m._id.toString());
      await Message.deleteMany({ _id: { $in: deletableIds } });

      const publicIds = msgs.filter((m) => m.type === "public").map((m) => m._id.toString());
      if (publicIds.length) {
        io.emit("message:deleted", { ids: publicIds, scope: "public" });
      }

      // Group DM deletions by the other party, since each party only needs
      // their own thread's ids, and we want one event per recipient, not one per message.
      const dmGroups = {};
      msgs.filter((m) => m.type === "dm").forEach((m) => {
        (dmGroups[m.to] ||= []).push(m._id.toString());
      });
      for (const [otherParty, groupIds] of Object.entries(dmGroups)) {
        const recipientSocketId = onlineUsers.get(otherParty);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("message:deleted", { ids: groupIds, scope: "dm", withUser: socket.username });
        }
        socket.emit("message:deleted", { ids: groupIds, scope: "dm", withUser: otherParty });
      }
    } catch (err) {
      console.error("Failed to delete message(s):", err.message);
    }
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.username);
    broadcastPresence();
    console.log(`${socket.username} disconnected`);
  });
});

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
}

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  const ip = getLocalIP();
  console.log(`Server running on http://${ip}:${PORT}`);
  console.log(`Open the app from other devices at http://${ip}:5173`);
});
