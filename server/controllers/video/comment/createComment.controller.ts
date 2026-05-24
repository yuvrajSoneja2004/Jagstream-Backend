import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../../database/prismaClient";

export const createComment = async (req: Request, res: Response) => {
  try {
    const { videoId, userId, commentText } = req.body;
    if (!videoId || !userId || !commentText) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("got it ", videoId, userId, commentText);

    await PRISMA_CLIENT.videoComment.create({
      data: {
        videoUrl: videoId,
        userId,
        commentText,
      },
    });

    res.status(201).json({ message: "Comment created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
