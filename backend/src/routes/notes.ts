import { Router } from "express";
import { prisma } from "../prisma/client";

const router = Router();

router.get("/", async (req, res) => {
  const { candidateId } = req.query;

  try {
    const notes = await prisma.note.findMany({
      where: {
        candidateId: candidateId as string,
      },
    });
    res.status(200).json({ data: notes, error: null });
  } catch (error) {
    res.status(400).json({ data: null, error: "Failed to get notes" });
  }
});

router.post("/", async (req, res) => {
  const { candidateId, content } = req.body;

  try {
    const note = await prisma.note.create({
      data: {
        candidateId,
        content,
      },
    });
    res.status(201).json({ data: note, error: null });
  } catch (error) {
    res.status(400).json({ data: null, error: "Failed to create note" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const note = await prisma.note.update({
      where: { id },
      data: { content },
    });
    res.status(200).json({ data: note, error: null });
  } catch (error) {
    res.status(400).json({ data: null, error: "Failed to update note" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.note.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ data: null, error: "Failed to delete note" });
  }
});

export default router;
