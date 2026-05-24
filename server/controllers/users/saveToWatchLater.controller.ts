import { Request, Response } from "express";

import { PRISMA_CLIENT } from "../../database/prismaClient";
export const saveToWatchLater = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const { videoId, watchedAt } = req.body;

    console.log("oh nadaan 🐢🐢", videoId, watchedAt);

    // Find user by ID
    const addWatchLater = await PRISMA_CLIENT.userWatchLater.create({
      data: {
        userId,
        videoId,
        watchedAt,
      },
    });
    // If history doesn't exist, return 404
    if (!addWatchLater) {
      return res.status(404).json({
        success: false,
        message: "err",
      });
    }

    console.log("Success save To watch save");

    // Return user data
    return res.status(200).json({
      success: true,
      data: addWatchLater,
    });
  } catch (error) {
    console.error("Error fetching user's history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
