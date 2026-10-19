import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import tokenBlackListModel from "../models/blacklist.model.js";
import userModel from "../models/user.model.js";

interface AuthTokenPayload extends JwtPayload {
    userId: string;
}

export const authUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const token =
        req.cookies?.token ||
        (req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : undefined);

    if (!token) {
        res.status(401).json({
            message: "Unauthorized access, token is missing",
        });
        return;
    }

    try {
        const isBlacklisted = await tokenBlackListModel.findOne({ token });

        if (isBlacklisted) {
            res.status(401).json({
                message: "Unauthorized access, token is blacklisted",
            });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ message: "JWT_SECRET is not configured" });
            return;
        }

        const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;

        if (!decoded || typeof decoded.userId !== "string") {
            res.status(401).json({
                message: "Unauthorized access, invalid token payload",
            });
            return;
        }

        const user = await userModel.findById(decoded.userId);

        if (!user) {
            res.status(401).json({
                message: "Unauthorized access, user not found",
            });
            return;
        }

        req.user = user;
        next();
    } catch {
        res.status(401).json({
            message: "Unauthorized access, token is invalid or expired",
        });
    }
};

export default authUser;
