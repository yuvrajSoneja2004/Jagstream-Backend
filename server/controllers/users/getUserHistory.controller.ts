import { Request, Response } from "express";

import { PRISMA_CLIENT } from "../../database/prismaClient";
export const getUserHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    // Find user by ID and include watchHistory with video data
    const history = await PRISMA_CLIENT.user.findUnique({
      where: {
        userId: userId,
      },
      select: {
        watchHistory: {
          orderBy: {
            watchedAt: "desc",
          },
          include: {
            user: true,
            video: true,
          },
        },
        userId: true,
      },
    });

    // If history doesn't exist, return 404
    if (!history) {
      return res.status(404).json({
        success: false,
        message: "No History found",
      });
    }

    // Return user data
    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching user's history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
