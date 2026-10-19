import express from "express";
import authController from "../controllers/auth.controller.js";
import authUser from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authUser, authController.logout);
router.get("/me", authUser, authController.getMe);
router.put(
    "/profile",
    authUser,
    upload.single("profilePicture"),
    authController.updateProfile
);

export default router;