import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../../database/prismaClient";

export const replyComment = async (req: Request, res: Response) => {
  const { userId, videoId, commentId, replyText } = req.body;
  if (!userId || !videoId || !commentId || !replyText) {
    res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    console.log("my spirit is crying", userId, videoId, commentId, replyText);
    await PRISMA_CLIENT.commentReply.create({
      data: {
        replyText,
        commentId,
        userId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Yeah",
    });
  } catch (error) {
    console.log(error);
  }
};
