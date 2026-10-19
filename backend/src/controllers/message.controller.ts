import { Request, Response } from "express";
import { Types } from "mongoose";
import ConversationModel from "../models/Conversation.model.js";
import MessageModel from "../models/Message.model.js";
import { uploadFile } from "../services/storage.service.js";
import { emitToUser, getIO } from "../socket/socket.js";

export const getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const rawConvId = req.params.conversationId;
        const conversationId = Array.isArray(rawConvId) ? rawConvId[0] : rawConvId;

        if (!conversationId || typeof conversationId !== "string" || !Types.ObjectId.isValid(conversationId)) {
            res.status(400).json({ message: "Invalid conversation ID" });
            return;
        }

        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
            res.status(404).json({ message: "Conversation not found" });
            return;
        }

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === req.user!._id.toString()
        );

        if (!isParticipant) {
            res.status(403).json({ message: "You are not a participant in this conversation" });
            return;
        }

        const messages = await MessageModel.find({ conversation: conversationId })
            .populate("sender", "name username profilePicture")
            .sort({ createdAt: 1 });

        res.status(200).json({ messages });
    } catch (error: any) {
        console.error("Get messages error:", error);
        res.status(500).json({ message: error.message || "Failed to fetch messages" });
    }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const rawConvId = req.params.conversationId;
        const conversationId = Array.isArray(rawConvId) ? rawConvId[0] : rawConvId;

        if (!conversationId || typeof conversationId !== "string" || !Types.ObjectId.isValid(conversationId)) {
            res.status(400).json({ message: "Invalid conversation ID" });
            return;
        }

        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
            res.status(404).json({ message: "Conversation not found" });
            return;
        }

        const currentUserId = req.user._id;
        const isParticipant = conversation.participants.some(
            (p) => p.toString() === currentUserId.toString()
        );

        if (!isParticipant) {
            res.status(403).json({ message: "You are not a participant in this conversation" });
            return;
        }

        const text = (req.body.text || "").trim();

        if (!text && !req.file) {
            res.status(400).json({ message: "Message text or attachment is required" });
            return;
        }

        let mediaUrl = "";
        let mediaType: "image" | "file" | "none" = "none";

        if (req.file) {
            const isImage = req.file.mimetype.startsWith("image/");
            mediaType = isImage ? "image" : "file";

            const uploadResult = await uploadFile(
                req.file.buffer,
                `${Date.now()}_${req.file.originalname}`,
                "/chat_attachments",
                req.file.mimetype
            );
            mediaUrl = uploadResult.url;
        }

        const newMessage = await MessageModel.create({
            conversation: conversation._id,
            sender: currentUserId,
            text,
            mediaUrl,
            mediaType,
            readBy: [currentUserId],
        });

        // Update lastMessage on conversation
        await ConversationModel.findByIdAndUpdate(conversation._id, {
            lastMessage: newMessage._id,
        });

        const populatedMessage = await MessageModel.findById(newMessage._id).populate(
            "sender",
            "name username profilePicture"
        );

        // Notify recipient via Socket.io
        const recipientId = conversation.participants.find(
            (p) => p.toString() !== currentUserId.toString()
        );

        if (recipientId) {
            emitToUser(recipientId.toString(), "new_message", populatedMessage);
            emitToUser(recipientId.toString(), "conversation_updated", {
                conversationId: conversation._id,
                lastMessage: populatedMessage,
            });
        }

        // Also emit to conversation room if anyone is actively listening
        try {
            const io = getIO();
            io.to(`conversation:${conversation._id}`).emit("new_message", populatedMessage);
        } catch {
            // Socket may not be initialized in test environments
        }

        res.status(201).json({ message: populatedMessage });
    } catch (error: any) {
        console.error("Send message error:", error);
        res.status(500).json({ message: error.message || "Failed to send message" });
    }
};

export const markMessagesAsRead = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const rawConvId = req.params.conversationId;
        const conversationId = Array.isArray(rawConvId) ? rawConvId[0] : rawConvId;

        if (!conversationId || typeof conversationId !== "string" || !Types.ObjectId.isValid(conversationId)) {
            res.status(400).json({ message: "Invalid conversation ID" });
            return;
        }

        const currentUserId = req.user._id;

        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
            res.status(404).json({ message: "Conversation not found" });
            return;
        }

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === currentUserId.toString()
        );

        if (!isParticipant) {
            res.status(403).json({ message: "You are not a participant in this conversation" });
            return;
        }

        const result = await MessageModel.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: currentUserId },
                readBy: { $ne: currentUserId },
            },
            {
                $addToSet: { readBy: currentUserId },
            }
        );

        // Notify other participant that messages were read
        const otherParticipant = conversation.participants.find(
            (p) => p.toString() !== currentUserId.toString()
        );

        if (otherParticipant) {
            emitToUser(otherParticipant.toString(), "messages_read", {
                conversationId,
                readBy: currentUserId,
            });
        }

        res.status(200).json({
            message: "Messages marked as read",
            modifiedCount: result.modifiedCount,
        });
    } catch (error: any) {
        console.error("Mark messages read error:", error);
        res.status(500).json({
            message: error.message || "Failed to mark messages as read",
        });
    }
};

export default {
    getMessages,
    sendMessage,
    markMessagesAsRead,
};
