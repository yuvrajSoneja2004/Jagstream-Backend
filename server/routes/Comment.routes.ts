import express from "express";
import { createComment } from "../controllers/video/comment/createComment.controller";
import { getComments } from "../controllers/video/comment/getComments.controller";
import { replyComment } from "../controllers/video/comment/replyComment.controller";
import { getCommentReplies } from "../controllers/video/comment/getCommentReplies.controller";
const router = express.Router();

router.post("/createComment", createComment as any);
router.get("/getComments/:videoId", getComments as any);
router.post("/reply", replyComment as any);
router.get("/getCommentReplies/:commentId", getCommentReplies as any);

export default router;
