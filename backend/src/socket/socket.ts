import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import { parseCookie } from "cookie";
import UserModel, { IUser } from "../models/user.model.js";
import TokenBlackListModel from "../models/blacklist.model.js";

interface AuthTokenPayload extends JwtPayload {
    userId: string;
}

export interface SocketUser extends IUser {
    _id: any;
}

let io: Server | null = null;

// Map of userId -> Set of socket IDs (handles multiple devices/tabs per user)
const userSocketMap = new Map<string, Set<string>>();

export function getIO(): Server {
    if (!io) {
        throw new Error("Socket.io has not been initialized yet!");
    }
    return io;
}

export function getReceiverSocketIds(userId: string): string[] {
    const sockets = userSocketMap.get(userId.toString());
    return sockets ? Array.from(sockets) : [];
}

export function emitToUser(userId: string, event: string, data: unknown): void {
    if (!io) return;
    io.to(`user:${userId.toString()}`).emit(event, data);
}

export function isUserOnline(userId: string): boolean {
    const sockets = userSocketMap.get(userId.toString());
    return Boolean(sockets && sockets.size > 0);
}

export function initSocket(server: HttpServer): Server {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL
                ? process.env.CLIENT_URL.split(",").map((s) => s.trim())
                : ["http://localhost:5173", "http://localhost:3000"],
            credentials: true,
            methods: ["GET", "POST"],
        },
    });

    // Authentication middleware
    io.use(async (socket: Socket, next) => {
        try {
            let token: string | undefined = socket.handshake.auth?.token;

            // If not in auth object, inspect handshake cookies
            if (!token && socket.handshake.headers.cookie) {
                const parsed = parseCookie(socket.handshake.headers.cookie);
                token = parsed.token;
            }

            // If still not found, inspect Authorization header
            if (!token && socket.handshake.headers.authorization) {
                const authHeader = socket.handshake.headers.authorization;
                if (authHeader.startsWith("Bearer ")) {
                    token = authHeader.split(" ")[1];
                }
            }

            if (!token) {
                return next(new Error("Authentication failed: Token is missing"));
            }

            // Check if token is blacklisted
            const isBlacklisted = await TokenBlackListModel.findOne({ token });
            if (isBlacklisted) {
                return next(new Error("Authentication failed: Token is blacklisted"));
            }

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                return next(new Error("JWT_SECRET is not configured"));
            }

            const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
            if (!decoded || typeof decoded.userId !== "string") {
                return next(new Error("Authentication failed: Invalid payload"));
            }

            const user = await UserModel.findById(decoded.userId).select("-password");
            if (!user) {
                return next(new Error("Authentication failed: User not found"));
            }

            socket.data.user = user;
            socket.data.userId = user._id.toString();

            return next();
        } catch (error) {
            return next(new Error("Authentication failed: Invalid or expired token"));
        }
    });

    io.on("connection", (socket: Socket) => {
        const userId: string = socket.data.userId;

        // Register user socket
        if (!userSocketMap.has(userId)) {
            userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId)!.add(socket.id);

        // Join personal user room for direct messaging and notifications
        socket.join(`user:${userId}`);

        // Broadcast current online users to all clients
        io?.emit("get_online_users", Array.from(userSocketMap.keys()));

        console.log(`User connected: ${userId} (Socket: ${socket.id})`);

        // Join conversation room
        socket.on("join_conversation", (conversationId: string) => {
            if (conversationId) {
                socket.join(`conversation:${conversationId}`);
            }
        });

        // Leave conversation room
        socket.on("leave_conversation", (conversationId: string) => {
            if (conversationId) {
                socket.leave(`conversation:${conversationId}`);
            }
        });

        // Typing indicator
        socket.on(
            "typing",
            (data: { conversationId: string; receiverId?: string }) => {
                if (!data?.conversationId) return;

                const payload = {
                    conversationId: data.conversationId,
                    userId,
                    username: socket.data.user?.username,
                };

                if (data.receiverId) {
                    emitToUser(data.receiverId, "user_typing", payload);
                } else {
                    socket.to(`conversation:${data.conversationId}`).emit("user_typing", payload);
                }
            }
        );

        // Stop typing indicator
        socket.on(
            "stop_typing",
            (data: { conversationId: string; receiverId?: string }) => {
                if (!data?.conversationId) return;

                const payload = {
                    conversationId: data.conversationId,
                    userId,
                };

                if (data.receiverId) {
                    emitToUser(data.receiverId, "user_stop_typing", payload);
                } else {
                    socket.to(`conversation:${data.conversationId}`).emit("user_stop_typing", payload);
                }
            }
        );

        // Message read acknowledgment event
        socket.on(
            "message_read",
            (data: { conversationId: string; senderId: string; messageId?: string }) => {
                if (data?.senderId) {
                    emitToUser(data.senderId, "messages_read", {
                        conversationId: data.conversationId,
                        readBy: userId,
                        messageId: data.messageId,
                    });
                }
            }
        );

        // Disconnect handler
        socket.on("disconnect", () => {
            const userSockets = userSocketMap.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    userSocketMap.delete(userId);
                    // Broadcast updated online users
                    io?.emit("get_online_users", Array.from(userSocketMap.keys()));
                }
            }
            console.log(`User disconnected: ${userId} (Socket: ${socket.id})`);
        });
    });

    return io;
}

export default initSocket;
