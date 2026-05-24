import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

interface PaginatedRequest extends Request {
  body: {
    params: {
      cursor?: string;
      limit?: string;
      userId?: string;
      category?: string;
    };
  };
}

export const getVideos = async (req: PaginatedRequest, res: Response) => {
  try {
    // Get pagination parameters from request body
    const cursor = req.body.params.cursor;
    const limit = parseInt(req.body.params.limit || "8");
    const currentCategory = req.body.params.category;
    const userId = req.body.params.userId;
    console.log("Request body:", req.body);

    console.log("currentCategory", currentCategory);
    console.log("cursor", cursor);

    // Build where clause for cursor-based pagination
    const whereClause: any = {
      category: currentCategory,
    };

    // Add cursor condition if provided
    if (cursor) {
      whereClause.createdAt = {
        lt: new Date(cursor), // Get videos created before this cursor
      };
      console.log("Using cursor:", cursor, "Date:", new Date(cursor));
    } else {
      console.log("No cursor provided, getting first page");
    }

    // Get videos with cursor-based pagination
    const videos = await PRISMA_CLIENT.video.findMany({
      take: limit + 1, // Take one extra to check if there are more
      where: whereClause,
      include: {
        channel: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Assuming you have a createdAt field
      },
    });

    // Check if there are more videos
    const hasMore = videos.length > limit;
    const actualVideos = hasMore ? videos.slice(0, limit) : videos;

    // Get the cursor for the next page (createdAt of the last video)
    const nextCursor =
      hasMore && actualVideos.length > 0
        ? actualVideos[actualVideos.length - 1].createdAt.toISOString()
        : null;

    console.log(
      `Returning ${actualVideos.length} videos, hasMore: ${hasMore}, nextCursor: ${nextCursor}`
    );
    if (actualVideos.length > 0) {
      console.log(`First video createdAt: ${actualVideos[0].createdAt}`);
      console.log(
        `Last video createdAt: ${
          actualVideos[actualVideos.length - 1].createdAt
        }`
      );
    }
    const userWatchedDurations = await PRISMA_CLIENT.user.findFirst({
      where: {
        userId: userId,
      },
      select: {
        watchedVideosDurations: true,
      },
    });

    console.log("Disco", userWatchedDurations);

    res.status(200).json({
      videos: actualVideos,
      userWatchedDurations,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({
      message: "Failed to fetch videos",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// You might also want to add types for your video data
export interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: Date;
  channel: {
    id: string;
    name: string;
    // Add other channel fields you need
  };
  // Add other video fields you have
}
