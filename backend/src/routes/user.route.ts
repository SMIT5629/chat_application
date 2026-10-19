import express from "express";
import userController from "../controllers/user.controller.js";
import authUser from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authUser, userController.getUsers);
router.get("/:id", authUser, userController.getUserById);

export default router;
