import express from "express"
import AuthConttoller from "../controllers/auth.conttoller.js";
const router = express.Router();

router.post("/register", AuthConttoller.register);

export default router