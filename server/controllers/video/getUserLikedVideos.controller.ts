import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const getUserLikedVideos = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    const likedVideos = await PRISMA_CLIENT.videoLike.findMany({
      where: {
        userId: userId as string,
      },
      include: {
        video: true,
        user: true,
      },
      orderBy: {
        likedAt: "desc",
      },
    });

    console.log("High heels", likedVideos);

    return res
      .status(200)
      .json({ message: "User liked videos", likedVideos: likedVideos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
