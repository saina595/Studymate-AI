import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const flashcardSetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  topic: { type: String, trim: true, maxlength: 120, default: "Untitled flashcards" },
  originalText: { type: String, required: true, maxlength: 20000 },
  cards: { type: [cardSchema], required: true, validate: value => value.length > 0 }
}, { timestamps: true });

export default mongoose.model("FlashcardSet", flashcardSetSchema);
