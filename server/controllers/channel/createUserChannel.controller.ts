import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

interface CreateChannelBody {
  user: string;
  name: string;
  avatarUrl: string;
  description?: string;
  links?: {
    website?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
}

export const createUserChannel = async (
  req: Request<{}, {}, CreateChannelBody>,
  res: Response
): Promise<void> => {
  try {
    const { user: userId, name, avatarUrl, description, links } = req.body;

    // Check if user exists and doesn't have a channel
    const existingUser = await PRISMA_CLIENT.user.findUnique({
      where: { userId },
      select: {
        hasChannel: true,
        channels: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (existingUser.hasChannel || existingUser.channels.length > 0) {
      res.status(409).json({
        success: false,
        message: "User already has a channel",
      });
      return;
    }

    // Create channel with transaction to ensure all related updates are atomic
    const result = await PRISMA_CLIENT.$transaction(async (prisma) => {
      // Create the channel
      const channel = await prisma.channel.create({
        data: {
          name,
          avatarUrl,
          createdBy: userId,
          createdAt: new Date(),
          subscribers: [], // Initialize with empty array
          description: description || "",
        },
      });

      // Create the channel about section
      const channelAbout = await prisma.channelAbout.create({
        data: {
          channelId: channel.id,
          description: description || "",
          links: links || {}, // Store provided links or empty object
          createdAt: new Date(),
        },
      });

      // Update user to indicate they now have a channel
      await prisma.user.update({
        where: { userId },
        data: { hasChannel: true },
      });

      return { channel, channelAbout };
    });

    res.status(201).json({
      success: true,
      message: "Channel created successfully",
      data: {
        channel: {
          id: result.channel.id,
          name: result.channel.name,
          avatarUrl: result.channel.avatarUrl,
          createdAt: result.channel.createdAt,
          isVerified: result.channel.isVerified,
          subscribers: result.channel.subscribers,
          description: result.channel.description,
        },
        about: {
          description: result.channelAbout.description,
          links: result.channelAbout.links,
          createdAt: result.channelAbout.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Error creating channel:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error occurred while creating channel",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
