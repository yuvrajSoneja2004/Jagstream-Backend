import express from "express";
import { createUserChannel } from "../controllers/channel/createUserChannel.controller";
import { getChannelInfo } from "../controllers/channel/getChannelInfo.controller";
import { getAboutInfo } from "../controllers/channel/getAboutInfo.controller";
import { updateInfo } from "../controllers/channel/updateInfo";
import { getChannelHome } from "../controllers/channel/getChannelHome.controller";

const router = express.Router();

// ? PREFIX /api/v1/users

/**
 * @swagger
 * /hi:
 *   get:
 *     summary: Test endpoint to check if the server is running
 *     tags: [Channels]
 *     responses:
 *       200:
 *         description: Server is working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hi:
 *                   type: string
 *                   example: works
 */
router.get("/hi", (req, res) => {
  res.json({ hi: "works" });
});

/**
 * @swagger
 * /create:
 *   post:
 *     summary: Create a user channel
 *     tags: [Channels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user creating the channel
 *               channelName:
 *                 type: string
 *                 description: Name of the channel
 */
router.post("/create", createUserChannel as any);

/**
 * @swagger
 * /channel/{userId}:
 *   get:
 *     summary: Get channel information by user ID
 *     tags: [Channels]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 */
router.get("/channel/:userId", getChannelInfo as any);

/**
 * @swagger
 * /channel/home/{channelId}:
 *   get:
 *     summary: Get channel home information by channel ID
 *     tags: [Channels]
 *     parameters:
 *       - name: channelId
 *         in: path
 *         required: true
 *         description: ID of the channel
 *         schema:
 *           type: string
 */
router.get("/channel/home/:channelId", getChannelHome as any);

/**
 * @swagger
 * /getAboutInfo/{channelId}:
 *   get:
 *     summary: Get about information of a channel
 *     tags: [Channels]
 *     parameters:
 *       - name: channelId
 *         in: path
 *         required: true
 *         description: ID of the channel
 *         schema:
 *           type: string
 */
router.get("/getAboutInfo/:channelId", getAboutInfo as any);

/**
 * @swagger
 * /updateInfo/{channelId}:
 *   put:
 *     summary: Update channel information
 *     tags: [Channels]
 *     parameters:
 *       - name: channelId
 *         in: path
 *         required: true
 *         description: ID of the channel to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newInfo:
 *                 type: object
 *                 description: Updated channel information
 *                 example:
 *                   description: "Updated channel description"
 *                   tags: ["tag1", "tag2"]
 */
router.put("/updateInfo/:channelId", updateInfo as any);

export default router;
