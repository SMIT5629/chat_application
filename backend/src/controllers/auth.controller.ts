import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import TokenBlackListModel from "../models/blacklist.model.js";
import { uploadFile } from "../services/storage.service.js";

const authCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, username, email, password } = req.body;

        if (!name || !username || !email || !password) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ message: "Password must be at least 6 characters long" });
            return;
        }

        const existingEmail = await UserModel.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            res.status(400).json({ message: "Email is already registered" });
            return;
        }

        const existingUsername = await UserModel.findOne({ username: username.trim() });
        if (existingUsername) {
            res.status(400).json({ message: "Username is already taken" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await UserModel.create({
            name: name.trim(),
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
        });

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ message: "JWT_SECRET is not configured" });
            return;
        }

        const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: "7d" });
        res.cookie("token", token, authCookieOptions);

        res.status(201).json({
            message: "User registered successfully",
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt,
            },
            token,
        });
    } catch (error: any) {
        console.error("Register error:", error);
        res.status(500).json({ message: error.message || "Failed to register user" });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }

        const user = await UserModel.findOne({ email: email.toLowerCase().trim() }).select("+password");

        if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ message: "JWT_SECRET is not configured" });
            return;
        }

        const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: "7d" });
        res.cookie("token", token, authCookieOptions);

        res.status(200).json({
            message: "User logged in successfully",
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt,
            },
            token,
        });
    } catch (error: any) {
        console.error("Login error:", error);
        res.status(500).json({ message: error.message || "Failed to log in" });
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const token =
            req.cookies?.token ||
            (req.headers.authorization?.startsWith("Bearer ")
                ? req.headers.authorization.split(" ")[1]
                : undefined);

        if (token) {
            // Save to blacklist model so it cannot be used again
            await TokenBlackListModel.create({ token }).catch(() => {});
        }

        res.clearCookie("token", {
            ...authCookieOptions,
            maxAge: 0,
        });

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error: any) {
        console.error("Logout error:", error);
        res.status(500).json({ message: error.message || "Failed to log out" });
    }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        res.status(200).json({
            user: {
                _id: req.user._id,
                name: req.user.name,
                username: req.user.username,
                email: req.user.email,
                profilePicture: req.user.profilePicture,
                createdAt: req.user.createdAt,
            },
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Failed to retrieve user profile" });
    }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { name, username } = req.body;
        const updates: { name?: string; username?: string; profilePicture?: string } = {};

        if (name && typeof name === "string") {
            updates.name = name.trim();
        }

        if (username && typeof username === "string") {
            const cleanUsername = username.trim();
            if (cleanUsername !== req.user.username) {
                const existing = await UserModel.findOne({ username: cleanUsername });
                if (existing) {
                    res.status(400).json({ message: "Username is already taken" });
                    return;
                }
                updates.username = cleanUsername;
            }
        }

        // Check if an image file was uploaded
        if (req.file) {
            const uploadResult = await uploadFile(
                req.file.buffer,
                `avatar_${req.user._id}_${Date.now()}.jpg`,
                "/chat_avatars",
                req.file.mimetype
            );
            updates.profilePicture = uploadResult.url;
        } else if (req.body.profilePicture && typeof req.body.profilePicture === "string") {
            updates.profilePicture = req.body.profilePicture;
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true }
        );

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error: any) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: error.message || "Failed to update profile" });
    }
};

export default {
    register,
    login,
    logout,
    getMe,
    updateProfile,
};
