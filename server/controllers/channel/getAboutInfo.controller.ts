import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const getAboutInfo = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    if (!channelId) {
      return res.json({
        success: false,
        message: "Channel ID is required",
      });
    }

    const channelInfo = await PRISMA_CLIENT.channelAbout.findFirst({
      where: {
        id: parseInt(channelId),
      },
    });

    if (!channelInfo) {
      return res.json({
        success: false,
        message: "Channel not found",
      });
    }

    return res.json({
      success: true,
      data: channelInfo,
    });
  } catch (error) {
    console.log(error);
  }
};
