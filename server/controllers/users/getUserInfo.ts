import { Request, Response } from "express";

import { PRISMA_CLIENT } from "../../database/prismaClient";
export const getUserInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    // Find user by ID
    const user = await PRISMA_CLIENT.user.findUnique({
      where: {
        userId: userId,
      },
    });

    // If user doesn't exist, return 404
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "USER_NOT_FOUND",
      });
    }

    // Return user data
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
