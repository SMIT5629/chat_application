import express from "express"
import morgan from "morgan"
import connectDB from "./config/connectDB.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
    res.send("Server is running!");
});

app.get("/love", (req, res) => {
    res.send("love is here!");
});

export default app;