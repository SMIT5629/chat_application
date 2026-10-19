import express from "express";
import messageController from "../controllers/message.controller.js";
import authUser from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/:conversationId", authUser, messageController.getMessages);
router.post(
    "/:conversationId",
    authUser,
    upload.single("file"),
    messageController.sendMessage
);
router.put("/read/:conversationId", authUser, messageController.markMessagesAsRead);

export default router;
