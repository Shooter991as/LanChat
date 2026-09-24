import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, // creates a unique index — Mongo rejects duplicate usernames itself
      trim: true,
      minlength: 3,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Instance method: compares a plain-text login attempt against the stored hash.
// Never compare plain-text passwords directly — always through bcrypt.
userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

export default mongoose.model("User", userSchema);
