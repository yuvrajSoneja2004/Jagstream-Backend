import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const getUpNextVideos = async (req: Request, res: Response) => {
  try {
    const { videoUrlId } = req.params;

    // Step 1: Get the current video to retrieve its type, uploadedBy, and tags
    const currentVideo = await PRISMA_CLIENT.video.findFirst({
      where: { videoUrl: videoUrlId },
      select: {
        type: true, // Replace `type` with the relevant attribute you need
        uploadedBy: true,
        tags: true,
      },
    });

    if (!currentVideo) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Step 2: Use the current video's tags to find related videos
    const upNextVideos = await PRISMA_CLIENT.video.findMany({
      where: {
        AND: [
          { videoUrl: { not: videoUrlId } }, // Exclude the current video itself
          {
            OR: [
              { uploadedBy: currentVideo.uploadedBy }, // Videos from the same uploader
              { type: currentVideo.type }, // Videos of the same type/category
              { tags: { hasSome: currentVideo.tags } }, // Videos with shared tags
            ],
          },
        ],
      },
      orderBy: {
        views: "desc", // Sort by popularity (views)
      },
      take: 5, // Limit the number of suggestions
    });

    console.log("Up Next Videos:", upNextVideos);

    res.json(upNextVideos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};