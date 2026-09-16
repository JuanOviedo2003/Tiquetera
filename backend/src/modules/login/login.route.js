import { Router } from "express";
import LoginController from "./login.controller.js";

const loginRouter = Router();
const loginController = new LoginController();

// HU-R1: POST /api/login -> { email, password }
loginRouter.post("/", loginController.login);

export default loginRouter;
