import { Request, Response } from "express";
import { redisClient } from "../../database/redisClient";

export const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    console.log("this", query);
    const cachedSuggestions = await redisClient.get("searchSuggestions");
    if (!cachedSuggestions) {
      return res.status(404).json({
        error: "Not Found",
        message: "No search suggestions available",
      });
    }

    const suggestions = JSON.parse(cachedSuggestions);
    console.log(suggestions);
    const sortedSuggestions = suggestions
      // Filter suggestions that start with the query (case-insensitive)
      .filter((suggestion: any) =>
        suggestion?.query?.toLowerCase().startsWith(query?.toLowerCase())
      )
      // Sort by priority in descending order (highest first)
      .sort((a: any, b: any) => b.priority - a.priority)
      // Then take the first 7 items
      .slice(0, 7);

    return res.json(sortedSuggestions);
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch search suggestions",
    });
  }
};
