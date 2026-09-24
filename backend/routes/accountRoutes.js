import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.put("/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect." });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update password." });
  }
});

router.delete("/", requireAuth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password confirmation is required to delete your account." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password." });

    // Clean up their messages too, so deleted accounts don't leave orphaned chat history
    await Message.deleteMany({ $or: [{ from: user.username }, { to: user.username }] });
    await User.findByIdAndDelete(user._id);

    res.json({ message: "Account deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete account." });
  }
});

export default router;
