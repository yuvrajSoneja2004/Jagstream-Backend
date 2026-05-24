import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const removeFromHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, videoId } = req.params;

    // Check if user exists
    const existingUser = await PRISMA_CLIENT.user.findUnique({
      where: { userId },
      select: {
        userId: true,
      },
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Remove video from user history
    await PRISMA_CLIENT.userWatchHistory.deleteMany({
      where: {
        userId,
        videoId,
      },
    });

    res.json({
      success: true,
      message: "Video removed from history",
    });
    console.log("well this is fucking success...");
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
