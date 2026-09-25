import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  type: { type: String, enum: ["public", "dm"], required: true },
  from: { type: String, required: true },
  to: { type: String }, // only set for type "dm"
  content: { type: String, default: "" },
  mediaUrl: { type: String }, // set when the message is a file/image attachment
  mediaName: { type: String }, // original filename, for non-image downloads
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Message", messageSchema);
