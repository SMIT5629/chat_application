import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/connectDB.js";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import messageRoutes from "./routes/message.route.js";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration for frontends (e.g. React / Vite)
const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((s) => s.trim())
    : ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, Postman)
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(null, true); // Dev-friendly fallback
        },
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// URL normalization middleware: cleans up duplicate slashes and accidental spaces
app.use((req: Request, res: Response, next: NextFunction) => {
    const cleanedPath = req.url
        .split("?")[0]
        ?.split("/")
        .map((s) => s.trim())
        .filter(Boolean)
        .join("/");
    const query = req.url.includes("?") ? "?" + req.url.split("?")[1] : "";
    req.url = "/" + (cleanedPath || "") + query;
    next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/conversation", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/message", messageRoutes);

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date() });
});

app.get("/", (req: Request, res: Response) => {
    res.send("Chat Application Backend is running!");
});

// 404 Handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Server Error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
    });
});

export default app;