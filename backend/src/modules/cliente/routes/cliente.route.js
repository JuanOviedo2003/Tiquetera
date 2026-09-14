import { Router } from "express";
import ClienteController from "../controllers/cliente.controller.js";

const clienteRouter = Router();
const clienteController = new ClienteController();

clienteRouter.get("/", clienteController.listar);
clienteRouter.post("/", clienteController.crear);
clienteRouter.get("/:id", clienteController.obtenerPorId);

export default clienteRouter;
