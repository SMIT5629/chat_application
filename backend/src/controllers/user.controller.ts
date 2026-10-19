import { Request, Response } from "express";
import UserModel from "../models/user.model.js";
import { isUserOnline } from "../socket/socket.js";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const currentUserId = req.user._id;
        const searchQuery = (req.query.search as string) || "";

        let filter: any = { _id: { $ne: currentUserId } };

        if (searchQuery.trim()) {
            const regex = new RegExp(searchQuery.trim(), "i");
            filter = {
                _id: { $ne: currentUserId },
                $or: [{ name: regex }, { username: regex }, { email: regex }],
            };
        }

        const users = await UserModel.find(filter)
            .select("-password")
            .limit(50)
            .sort({ name: 1 });

        const usersWithPresence = users.map((u) => ({
            _id: u._id,
            name: u.name,
            username: u.username,
            email: u.email,
            profilePicture: u.profilePicture,
            createdAt: u.createdAt,
            isOnline: isUserOnline(u._id.toString()),
        }));

        res.status(200).json({ users: usersWithPresence });
    } catch (error: any) {
        console.error("Get users error:", error);
        res.status(500).json({ message: error.message || "Failed to fetch users" });
    }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const rawId = req.params.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;

        if (!id || typeof id !== "string") {
            res.status(400).json({ message: "User ID is required" });
            return;
        }

        const user = await UserModel.findById(id).select("-password");

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt,
                isOnline: isUserOnline(user._id.toString()),
            },
        });
    } catch (error: any) {
        console.error("Get user by ID error:", error);
        res.status(500).json({ message: error.message || "Failed to fetch user" });
    }
};

export default {
    getUsers,
    getUserById,
};
