import { Request, Response } from "express";
import { Types } from "mongoose";
import ConversationModel from "../models/Conversation.model.js";
import UserModel from "../models/user.model.js";
import MessageModel from "../models/Message.model.js";
import { isUserOnline } from "../socket/socket.js";

export const getConversations = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const userId = req.user._id;

        const conversations = await ConversationModel.find({
            participants: userId,
        })
            .populate("participants", "name username email profilePicture")
            .populate("lastMessage")
            .sort({ updatedAt: -1 });

        // Calculate unread count and online status for each conversation
        const conversationData = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await MessageModel.countDocuments({
                    conversation: conv._id,
                    sender: { $ne: userId },
                    readBy: { $ne: userId },
                });

                // Find other participant
                const otherParticipant = conv.participants.find(
                    (p: any) => p._id.toString() !== userId.toString()
                ) as any;

                return {
                    _id: conv._id,
                    participants: conv.participants,
                    lastMessage: conv.lastMessage,
                    updatedAt: conv.updatedAt,
                    createdAt: conv.createdAt,
                    unreadCount,
                    otherUser: otherParticipant
                        ? {
                              _id: otherParticipant._id,
                              name: otherParticipant.name,
                              username: otherParticipant.username,
                              email: otherParticipant.email,
                              profilePicture: otherParticipant.profilePicture,
                              isOnline: isUserOnline(otherParticipant._id.toString()),
                          }
                        : null,
                };
            })
        );

        res.status(200).json({ conversations: conversationData });
    } catch (error: any) {
        console.error("Get conversations error:", error);
        res.status(500).json({ message: error.message || "Failed to fetch conversations" });
    }
};

export const getOrCreateConversation = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const currentUserId = req.user._id;
        const receiverId = req.body.receiverId || req.body.participantId;

        if (!receiverId) {
            res.status(400).json({ message: "Receiver ID is required" });
            return;
        }

        if (receiverId.toString() === currentUserId.toString()) {
            res.status(400).json({ message: "Cannot create conversation with yourself" });
            return;
        }

        if (!Types.ObjectId.isValid(receiverId)) {
            res.status(400).json({ message: "Invalid receiver ID format" });
            return;
        }

        const receiverExists = await UserModel.findById(receiverId);
        if (!receiverExists) {
            res.status(404).json({ message: "Target user not found" });
            return;
        }

        // Check if conversation already exists between the two users
        let conversation = await ConversationModel.findOne({
            participants: { $all: [currentUserId, receiverId], $size: 2 },
        })
            .populate("participants", "name username email profilePicture")
            .populate("lastMessage");

        if (!conversation) {
            // Create new conversation
            const newConv = await ConversationModel.create({
                participants: [currentUserId, receiverId],
            });

            conversation = await ConversationModel.findById(newConv._id)
                .populate("participants", "name username email profilePicture")
                .populate("lastMessage");
        }

        res.status(200).json({ conversation });
    } catch (error: any) {
        console.error("Get or create conversation error:", error);
        res.status(500).json({
            message: error.message || "Failed to get or create conversation",
        });
    }
};

export const getConversationById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const rawId = req.params.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;

        if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid conversation ID" });
            return;
        }

        const conversation = await ConversationModel.findById(id)
            .populate("participants", "name username email profilePicture")
            .populate("lastMessage");

        if (!conversation) {
            res.status(404).json({ message: "Conversation not found" });
            return;
        }

        const isParticipant = conversation.participants.some(
            (p: any) => p._id.toString() === req.user!._id.toString()
        );

        if (!isParticipant) {
            res.status(403).json({ message: "You are not a participant in this conversation" });
            return;
        }

        res.status(200).json({ conversation });
    } catch (error: any) {
        console.error("Get conversation by ID error:", error);
        res.status(500).json({ message: error.message || "Failed to fetch conversation" });
    }
};

export default {
    getConversations,
    getOrCreateConversation,
    getConversationById,
};
