import express from "express";
import conversationController from "../controllers/conversation.controller.js";
import authUser from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authUser, conversationController.getConversations);
router.post("/", authUser, conversationController.getOrCreateConversation);
router.get("/:id", authUser, conversationController.getConversationById);

export default router;
