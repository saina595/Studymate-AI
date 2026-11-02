import mongoose from "mongoose";

const summarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  topic: { type: String, trim: true, maxlength: 120, default: "Untitled notes" },
  originalText: { type: String, required: true, maxlength: 20000 },
  summary: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("Summary", summarySchema);
