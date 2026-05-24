import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../../database/prismaClient";

export const getComments = async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const { sortBy } = req.query;
  try {
    if (!videoId) {
      return res.status(400).json({
        message: "Video id is required",
      });
    }
    const comments = await PRISMA_CLIENT.videoComment.findMany({
      where: {
        videoUrl: videoId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });
    res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    console.log(error);
  }
};
