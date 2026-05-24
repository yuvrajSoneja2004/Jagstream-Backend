import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const updateInfo = async (req: Request, res: Response) => {
  try {
    if (!req.params.channelId) {
      return res.status(400).json({ error: "Channel ID is required" });
    }

    if (
      !req.body.name ||
      !req.body.description ||
      !req.body.bannerUrl ||
      !req.body.avatarUrl
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (
      typeof req.body.name !== "string" ||
      typeof req.body.description !== "string" ||
      typeof req.body.bannerUrl !== "string" ||
      typeof req.body.avatarUrl !== "string"
    ) {
      return res.status(400).json({ error: "All fields must be strings" });
    }

    const { channelId } = req.params;
    const { name, description, bannerUrl, avatarUrl } = req.body;

    const updateChannelInfo = await PRISMA_CLIENT.channel.update({
      where: {
        id: parseInt(channelId),
      },
      data: {
        name,
        description,
        bannerUrl,
        avatarUrl,
      },
    });

    return res.status(200).json(updateChannelInfo);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
