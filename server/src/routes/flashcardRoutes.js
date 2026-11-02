import { Router } from "express";
import mongoose from "mongoose";
import FlashcardSet from "../models/FlashcardSet.js";
import requireAuth from "../middleware/requireAuth.js";
import { generateFlashcards } from "../services/geminiService.js";

const router = Router();
router.use(requireAuth);

router.post("/generate", async (req, res, next) => {
  try {
    const originalText = String(req.body.originalText || "").trim();
    const topic = String(req.body.topic || "Untitled flashcards").trim().slice(0, 120) || "Untitled flashcards";

    if (originalText.length < 30) {
      return res.status(400).json({ message: "Please enter at least 30 characters of study material." });
    }
    if (originalText.length > 20000) {
      return res.status(400).json({ message: "Please keep the input under 20,000 characters." });
    }

    const cards = await generateFlashcards(originalText, topic);
    const saved = await FlashcardSet.create({
      userId: req.userId,
      topic,
      originalText,
      cards
    });
    res.status(201).json({ flashcardSet: saved });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const flashcardSets = await FlashcardSet.find({ userId: req.userId })
      .select("topic cards createdAt")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ flashcardSets });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid flashcard set ID." });
    const flashcardSet = await FlashcardSet.findOne({ _id: req.params.id, userId: req.userId });
    if (!flashcardSet) return res.status(404).json({ message: "Flashcard set not found." });
    res.json({ flashcardSet });
  } catch (error) {
    next(error);
  }
});

export default router;
