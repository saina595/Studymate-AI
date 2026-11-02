import { Router } from "express";
import mongoose from "mongoose";
import Summary from "../models/Summary.js";
import requireAuth from "../middleware/requireAuth.js";
import { generateSummary } from "../services/geminiService.js";

const router = Router();
router.use(requireAuth);

router.post("/", async (req, res, next) => {
  try {
    const originalText = String(req.body.originalText || "").trim();
    const topic = String(req.body.topic || "Untitled notes").trim().slice(0, 120) || "Untitled notes";

    if (originalText.length < 30) {
      return res.status(400).json({ message: "Please enter at least 30 characters of study material." });
    }
    if (originalText.length > 20000) {
      return res.status(400).json({ message: "Please keep the input under 20,000 characters." });
    }

    const summaryText = await generateSummary(originalText);
    const saved = await Summary.create({
      userId: req.userId,
      topic,
      originalText,
      summary: summaryText
    });
    res.status(201).json({ summary: saved });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const summaries = await Summary.find({ userId: req.userId })
      .select("topic summary createdAt")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ summaries });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid summary ID." });
    const summary = await Summary.findOne({ _id: req.params.id, userId: req.userId });
    if (!summary) return res.status(404).json({ message: "Summary not found." });
    res.json({ summary });
  } catch (error) {
    next(error);
  }
});

export default router;
