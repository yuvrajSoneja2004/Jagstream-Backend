import express from "express";
import { createUser } from "../controllers/users/createUser.controller";
import { getUserInfo } from "../controllers/users/getUserInfo";
import { getUserHistory } from "../controllers/users/getUserHistory.controller";
import { updateUserHistory } from "../controllers/users/updateUserHistory.controller";
import { removeFromHistory } from "../controllers/users/removeFromHistory.controller";
import { getWatchLater } from "../controllers/users/getWatchLater.controller";
import { saveToWatchLater } from "../controllers/users/saveToWatchLater.controller";

const router = express.Router();

/**
 * @swagger
 * /createUser:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 */
router.post("/createUser", createUser as any);

/**
 * @swagger
 * /getInfo/{userId}:
 *   get:
 *     summary: Get user information by user ID
 *     tags: [Users]
 */
router.get("/getInfo/:userId", getUserInfo as any);

/**
 * @swagger
 * /getHistory/{userId}:
 *   get:
 *     summary: Get user history by user ID
 *     tags: [Users]
 */
router.get("/getHistory/:userId", getUserHistory as any);

/**
 * @swagger
 * /updateUserHistory/{userId}:
 *   post:
 *     summary: Update user history
 *     tags: [Users]
 */
router.post("/updateUserHistory/:userId", updateUserHistory as any);
router.put("/removeFromHistory/:userId/:videoId", removeFromHistory as any);
router.get("/getWatchLater/:userId", getWatchLater as any);
router.post("/saveToWatchLater/:userId", saveToWatchLater as any);

export default router;
