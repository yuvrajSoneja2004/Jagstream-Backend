import { Request, Response } from "express";

import { PRISMA_CLIENT } from "../../database/prismaClient";
export const updateUserHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const { videoId, watchedAt } = req.body;

    console.log("Dal khai 🐢🐢", videoId, watchedAt);

    // Find user by ID
    const updateHistory = await PRISMA_CLIENT.userWatchHistory.create({
      data: {
        userId,
        videoId,
        watchedAt,
      },
      
    });
    // If history doesn't exist, return 404
    if (!updateHistory) {
      return res.status(404).json({
        success: false,
        message: "err",
      });
    }

    // Return user data
    return res.status(200).json({
      success: true,
      data: updateHistory,
    });
  } catch (error) {
    console.error("Error fetching user's history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
