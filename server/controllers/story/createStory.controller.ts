import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { PRISMA_CLIENT } from "../../database/prismaClient";
import { uploadToImgBB } from "../../helpers/uploadToImgbb";

const createStory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // const { title, pictureUrl } = req.body;

    console.log("buro buro", req.file);

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload an image",
      });
    }

    const story = await PRISMA_CLIENT.userStories.create({
      data: {
        title: req.body.title,
        pictureUrl: await uploadToImgBB(req.file),
        postedBy: req.body.userId,
      },
    });
    res.status(201).json({
      success: true,
      message: "Story created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export default createStory;
