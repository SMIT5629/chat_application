import authController from "./auth.controller.js";

export const { register, login, logout, getMe, updateProfile } = authController;
export default authController;
