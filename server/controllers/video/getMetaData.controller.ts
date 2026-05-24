import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const getMetaData = async (req: Request, res: Response) => {
  try {
    const { videoUrlId } = req.params;

    const metadata = await PRISMA_CLIENT.video.findFirst({
      where: {
        videoUrl: videoUrlId,
      },
      include: {
        channel: true,
        likes: true,
        dislikes: true,
      },
    });
    return res.status(200).json(metadata);
  } catch (error) {
    console.log(error);
  }
};
// export const getMetaData = async (req: Request , res: Response) => {
//     try {

//     } catch (error) {
//         console.log(error)
//     }
// }
