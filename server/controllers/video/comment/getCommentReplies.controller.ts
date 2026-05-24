import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../../database/prismaClient";

export const getCommentReplies = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    console.log("this is the lol man", commentId);
    if (!commentId) {
      return res.status(400).json({
        message: "Comment id is required",
      });
    }
    const replies = await PRISMA_CLIENT.commentReply.findMany({
      where: {
        commentId: parseInt(commentId),
      },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
    console.log(replies);

    res.status(200).json({
      success: true,
      replies,
    });
  } catch (error) {
    console.log(error);
  }
};
