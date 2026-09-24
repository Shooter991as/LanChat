import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import os from "os";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import Message from "./models/Message.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/account", accountRoutes);

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

  socket.on("message:public", async ({ content }) => {
    if (!content?.trim()) return;
    const payload = { username: socket.username, content, timestamp: Date.now() };
    io.emit("message:public", payload);
    try {
      await Message.create({ type: "public", from: socket.username, content });
    } catch (err) {
      console.error("Failed to save public message:", err.message);
    }
  });

  socket.on("message:dm", async ({ toUsername, content }) => {
    if (!content?.trim() || !toUsername) return;
    const payload = {
      fromUsername: socket.username,
      toUsername,
      content,
      timestamp: Date.now(),
    };
    const recipientSocketId = onlineUsers.get(toUsername);
    if (recipientSocketId) io.to(recipientSocketId).emit("message:dm", payload);
    socket.emit("message:dm", payload); // echo to sender

    try {
      await Message.create({ type: "dm", from: socket.username, to: toUsername, content });
    } catch (err) {
      console.error("Failed to save DM:", err.message);
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
  console.log(`Set frontend/.env → VITE_SERVER_URL=http://${ip}:${PORT}`);
});
