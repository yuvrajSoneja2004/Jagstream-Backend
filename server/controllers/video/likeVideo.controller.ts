import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const likeVideo = async (req: Request, res: Response) => {
  try {
    const { userId, videoId, eventType } = req.body;

    // Validate required fields
    if (!userId || !videoId || !eventType) {
      return res
        .status(400)
        .json({ message: "userId, videoId, and eventType are required" });
    }

    const parsedVideoId = parseInt(videoId, 10);
    if (isNaN(parsedVideoId)) {
      return res.status(400).json({ message: "Invalid videoId" });
    }

    // Handle event types
    if (eventType === "checkAlreadyLiked") {
      // Check if the user has already liked the video
      const existingLike = await PRISMA_CLIENT.videoLike.findFirst({
        where: {
          userId,
          videoId: parsedVideoId,
        },
      });

      if (existingLike) {
        return res
          .status(200)
          .json({ message: "Video already liked", liked: true });
      }

      return res.status(200).json({ message: "Video not liked", liked: false });
    }

    if (eventType === "likeVideo") {
      // Check if the user has already liked the video
      const existingLike = await PRISMA_CLIENT.videoLike.findFirst({
        where: {
          userId,
          videoId: parsedVideoId,
        },
      });

      if (existingLike) {
        // If the user already liked the video, remove the like (toggle functionality)
        await PRISMA_CLIENT.videoLike.delete({
          where: { id: existingLike.id },
        });

        return res.status(200).json({ message: "Like removed" });
      }

      // If no like exists, create a new like
      const saveLike = await PRISMA_CLIENT.videoLike.create({
        data: {
          userId,
          videoId: parsedVideoId,
        },
      });

      return res.status(201).json({ message: "Video liked", like: saveLike });
    }

    return res.status(400).json({ message: "Invalid eventType" });
  } catch (error) {
    console.error("Error handling video like event:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
