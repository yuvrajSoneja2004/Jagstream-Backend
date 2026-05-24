import { Request, Response } from "express";
import { PRISMA_CLIENT } from "../../database/prismaClient";

export const saveToGlobalSearchHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const { query } = req.body;

    // Check if the suggestion is already in global search history
    const existingHistory = await PRISMA_CLIENT.searchSuggestions.findFirst({
      where: {
        query,
      },
    });

    if (existingHistory) {
      // If it already exists, return the existing record
      return res.status(200).json(existingHistory);
    }

    // Create a new SearchHistory record for the user
    const searchHistory = await PRISMA_CLIENT.searchSuggestions.create({
      data: {
        query,
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
