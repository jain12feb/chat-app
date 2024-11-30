import express from "express";
import {
  checkAuth,
  deleteProfile,
  logout,
  signin,
  signup,
  updateProfile,
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
authRouter.post("/logout", logout);
authRouter.put("/update-profile", isAuthenticated, updateProfile);
authRouter.get("/check", isAuthenticated, checkAuth);
authRouter.delete("/delete-account", isAuthenticated, deleteProfile);

export default authRouter;
