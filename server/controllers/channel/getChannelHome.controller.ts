import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";
import { Prisma } from "@prisma/client";

export const getChannelHome = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;

    // Validate channelId
    if (!channelId || isNaN(parseInt(channelId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID provided",
      });
    }

    // Run both queries concurrently for better performance
    const [recentVideos, popularVideos] = await Promise.all([
      PRISMA_CLIENT.video.findMany({
        where: {
          uploadedBy: parseInt(channelId),
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          channel: true,
        },
        take: 12,
      }),
      PRISMA_CLIENT.video.findMany({
        where: {
          uploadedBy: parseInt(channelId),
        },
        orderBy: {
          views: "desc",
        },
        include: {
          channel: true,
        },
        take: 12,
      }),
    ]);

    // Check if channel exists by checking if any videos were found
    if (!recentVideos.length && !popularVideos.length) {
      return res.status(404).json({
        success: false,
        message: "Channel not found or has no videos",
      });
    }

    // Return success response with both video arrays
    return res.status(200).json({
      success: true,
      data: {
        recentVideos,
        popularVideos,
      },
    });
  } catch (error) {
    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "Database constraint violation",
        });
      }
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Record not found",
        });
      }
    }

    // Log the error for debugging
    console.error("Error in getChannelHome:", error);

    // Return generic error response
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred",
    });
  }
};
