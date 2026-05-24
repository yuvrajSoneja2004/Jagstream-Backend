import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const updateVideoWatchedDuration = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const { videoId, duration } = req.query;

    console.log(userId, typeof videoId, duration, "hai mera dil");

    // Validate required fields
    if (!userId || !videoId || !duration) {
      return res
        .status(400)
        .json({ message: "userId, videoId, and duration are required" });
    }

    // Update watched duration
    const user = await PRISMA_CLIENT.user.findUnique({
      where: { userId },
      select: { watchedVideosDurations: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const updatedWatchedVideosDurations = {
      ...(user.watchedVideosDurations as Record<string, any>), // Assuming it's an object with string keys and any values
      [videoId.toString()]: duration,
    };

    await PRISMA_CLIENT.user.update({
      where: { userId },
      data: { watchedVideosDurations: updatedWatchedVideosDurations },
    });

    return res
      .status(200)
      .json({ message: "Watched duration updated successfully" });
  } catch (error) {
    console.error("Error updating watched duration:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
