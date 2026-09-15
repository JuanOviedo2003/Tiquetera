import { Router } from "express";

import TiqueteraController from "../controllers/tiquetera.controller.js";

const tiqueteraRouter = Router();

const tiqueteraController = new TiqueteraController();

// Creación y consulta general
tiqueteraRouter.post("/", tiqueteraController.crear);
tiqueteraRouter.get("/", tiqueteraController.listar);

// Activación desde cliente (código + PIN)
tiqueteraRouter.post("/activar", tiqueteraController.activar);

// Operaciones por ID
tiqueteraRouter.get(
  "/:id/codigo-activacion",
  tiqueteraController.obtenerCodigoActivacion
);

tiqueteraRouter.get("/:id", tiqueteraController.obtenerPorId);

tiqueteraRouter.post("/:id/reemitir-codigo", tiqueteraController.reemitirCodigo);

export default tiqueteraRouter;