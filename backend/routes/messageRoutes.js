import express from "express";
import Message from "../models/Message.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Last 100 public messages, oldest first
router.get("/public", requireAuth, async (req, res) => {
  try {
    const messages = await Message.find({ type: "public" })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load public history." });
  }
});

// DM thread between the logged-in user and :username, oldest first
router.get("/dm/:username", requireAuth, async (req, res) => {
  try {
    const me = req.user.username;
    const other = req.params.username;
    const messages = await Message.find({
      type: "dm",
      $or: [
        { from: me, to: other },
        { from: other, to: me },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load DM history." });
  }
});

export default router;
