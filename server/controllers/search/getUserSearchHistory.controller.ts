import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const getUserSearchHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userHistory = await PRISMA_CLIENT.searchHistory.findMany({
      where: {
        userId,
      },
    });

    console.log("why", userHistory);

    return res.status(200).json(userHistory);
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch search suggestions",
    });
  }
};
