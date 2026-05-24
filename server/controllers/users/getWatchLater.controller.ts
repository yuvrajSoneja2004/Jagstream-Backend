import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const getWatchLater = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    // Find user by ID and include watchLater with video data
    const watchLater = await PRISMA_CLIENT.userWatchLater.findMany({
      where: {
        userId,
      },
      include: {
        user: true,
        video: true,
      },
    });

    // If watchLater doesn't exist, return 404
    if (!watchLater) {
      return res.status(404).json({
        success: false,
        message: "No Watch Later found",
      });
    }

    console.log("am a motherfucking millionaee", watchLater);

    // Return user data
    return res.status(200).json({
      success: true,
      data: watchLater,
    });
  } catch (error) {
    console.error("Error fetching user's watch later:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
