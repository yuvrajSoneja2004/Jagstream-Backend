import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { redisClient } from "../../database/redisClient";

const prisma = new PrismaClient();

const CACHE_KEY_PREFIX = "video-search:";
const CACHE_DURATION = 3600; // 1 hour in seconds

export const getSearchResults = async (req: Request, res: Response) => {
  try {
    const {
      query,
      page = 1,
      limit = 20,
      filter,
      userId,
    } = req.query as {
      query?: string;
      page?: number;
      limit?: number;
      filter?: string;
      userId?: string;
    };

    if (!query) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Search query is required",
      });
    }

    // Try to get cached results
    const cacheKey = `${CACHE_KEY_PREFIX}${query}:${page}:${limit}:${filter}`;
    const cachedResults = await redisClient.get(cacheKey);

    if (cachedResults) {
      // Save search history if user is authenticated
      if (userId) {
        await saveSearchHistory(userId, query);
      }
      return res.json(JSON.parse(cachedResults));
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build the base query
    const baseQuery = {
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { tags: { has: query } },
        {
          channel: {
            is: {
              name: { contains: query, mode: "insensitive" as const },
            },
          },
        },
      ],
    };

    // Perform search using Prisma
    const results = await prisma.video.findMany({
      where: baseQuery,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            isVerified: true,
            subscribers: true,
            description: true,
          },
        },
        _count: {
          select: {
            likes: true,
            dislikes: true,
            comments: true,
          },
        },
      },
      orderBy: [
        { views: "desc" }, // Sort by views by default
        { createdAt: "desc" }, // Then by date
      ],
      take: Number(limit),
      skip: skip,
    });

    // Get total count for pagination
    const total = await prisma.video.count({
      where: baseQuery,
    });

    const response = {
      results: results.map((video) => ({
        ...video,
        likeCount: video._count.likes,
        dislikeCount: video._count.dislikes,
        commentCount: video._count.comments,
        subscriberCount: video.channel.subscribers.length,
      })),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };

    // Cache the results
    await redisClient.setex(cacheKey, CACHE_DURATION, JSON.stringify(response));

    // Save search history if user is authenticated
    if (userId) {
      await saveSearchHistory(userId, query);
    }

    return res.json(response);
  } catch (error) {
    console.error("Error fetching search results:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch search results",
    });
  }
};

// Helper function to save search history
const saveSearchHistory = async (userId: string, query: string) => {
  await prisma.searchHistory.create({
    data: {
      userId,
      query,
    },
  });
};

// Autocomplete suggestions endpoint
export const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const { query } = req.query as { query?: string };

    if (!query) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Search query is required",
      });
    }

    const cacheKey = `${CACHE_KEY_PREFIX}suggestions:${query}`;
    const cachedSuggestions = await redisClient.get(cacheKey);

    if (cachedSuggestions) {
      return res.json(JSON.parse(cachedSuggestions));
    }

    // Get suggestions from SearchSuggestions table first (predefined suggestions)
    const predefinedSuggestions = await prisma.searchSuggestions.findMany({
      where: {
        query: { startsWith: query, mode: "insensitive" as const },
      },
      orderBy: { priority: "desc" },
      take: 3,
    });

    // Get most searched queries from search history
    const popularSearches = await prisma.searchHistory.groupBy({
      by: ["query"],
      where: { query: { startsWith: query, mode: "insensitive" as const } },
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 3,
    });

    // Get matching video titles
    const videoTitles = await prisma.video.findMany({
      where: { title: { startsWith: query, mode: "insensitive" as const } },
      select: { title: true },
      take: 4,
      orderBy: { views: "desc" },
    });

    const suggestions = [
      ...predefinedSuggestions.map((s) => s.query),
      ...popularSearches.map((s) => s.query),
      ...videoTitles.map((v) => v.title),
    ];

    // Remove duplicates and limit to 10 suggestions
    const uniqueSuggestions = Array.from(new Set(suggestions)).slice(0, 10);

    // Cache suggestions
    await redisClient.setex(
      cacheKey,
      CACHE_DURATION,
      JSON.stringify(uniqueSuggestions)
    );

    return res.json(uniqueSuggestions);
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch search suggestions",
    });
  }
};
