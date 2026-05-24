import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const getChannelInfo = async (req: Request, res: Response) => {
  const { userId } = req.params;
  console.log(userId, "sdf");

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  try {
    // Check if the channel exists
    const channel = await PRISMA_CLIENT.channel.findFirst({
      where: {
        createdBy: userId,
      },
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: channel,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
