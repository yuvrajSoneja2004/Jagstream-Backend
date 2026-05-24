import express from "express";
import { getSearchSuggestions } from "../controllers/search/getSearchSuggestions.controller";
import { redisClient } from "../database/redisClient";
import { getUserSearchHistory } from "../controllers/search/getUserSearchHistory.controller";
import { saveToSearchHistory } from "../controllers/search/saveToSearchHistory.controller";
import { saveToGlobalSearchHistory } from "../controllers/search/saveToGlobalSearchHistory.controller";
import { getSearchResults } from "../controllers/search/getSearchResults.controller";

// Type for the controller functions
type ControllerFunction = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => Promise<void>;

// Middleware to ensure Redis is connected
const ensureRedisConnection = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {  
  try {
    // Check if Redis client is connected
    const isConnected = redisClient.status === "ready";
    if (!isConnected) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Redis connection not ready",
      });
    }
    next();
  } catch (error) {
    console.error("Redis connection check failed:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to check Redis connection",
    });
  }
};

const router = express.Router();

// Apply Redis middleware to all routes that need Redis
router.get(
  "/getSearchSuggestions/:query",
  ensureRedisConnection as any,
  getSearchSuggestions as any
);
router.get(
  "/getUserSearchHistory/:userId",
  ensureRedisConnection as any,
  getUserSearchHistory as any
);
router.post(
  "/saveToSearchHistory",
  ensureRedisConnection as any,
  saveToSearchHistory as any
);
router.post(
  "/saveToGlobalSearchHistory",
  ensureRedisConnection as any,
  saveToGlobalSearchHistory as any
);
router.get(
  "/getSearchResults",
  ensureRedisConnection as any,
  getSearchResults as any
);

// If you need to add the createUser route back:
// router.post(
//   "/createUser",
//   createUser as ControllerFunction
// );

export default router;
