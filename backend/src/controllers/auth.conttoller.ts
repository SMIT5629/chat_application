import userModel from "../models/user.model.js"
import { RequestHandler } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const authCookieOptions = {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register: RequestHandler = async (req, res) => {

    const { name, username, email, password } = req.body
    const hashed = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        name,
        username,
        email,
        password: hashed
    })
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET is not configured");
    }
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: "7d" });
    res.cookie("token", token, authCookieOptions);

    res.status(201).json({
        message: "User registered successfully",
        user,
        token
    });

}

export default { register }

