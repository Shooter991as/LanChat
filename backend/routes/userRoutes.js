import express from "express";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Returns every registered username. Frontend cross-references this
// with the live presence list (from Socket.IO) to mark online/offline.
router.get("/", requireAuth, async (req, res) => {
  try {
    const users = await User.find({}, "username -_id").sort("username");
    res.json(users.map((u) => u.username));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

export default router;
