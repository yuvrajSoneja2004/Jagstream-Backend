import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const saveToSearchHistory = async (req: Request, res: Response) => {
  try {
    const { userId, suggestionQuery } = req.body;

    // Check if the suggestion is already in the user's search history
    const existingHistory = await PRISMA_CLIENT.searchHistory.findFirst({
      where: {
        userId,
        query: suggestionQuery,
      },
    });

    if (existingHistory) {
      // If it already exists, return the existing record
      return res.status(200).json(existingHistory);
    }

    // Create a new SearchHistory record for the user
    const searchHistory = await PRISMA_CLIENT.searchHistory.create({
      data: {
        userId,
        query: suggestionQuery,
      },
    });

    return res.status(200).json(searchHistory);
  } catch (error) {
    console.error("Error saving to search history:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to save to search history",
    });
  }
};
