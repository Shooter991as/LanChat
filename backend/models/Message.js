import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  type: { type: String, enum: ["public", "dm"], required: true },
  from: { type: String, required: true },
  to: { type: String }, // only set for type "dm"
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Message", messageSchema);
