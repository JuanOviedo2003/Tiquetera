import { Router } from "express";
import ConsumoController from "../controllers/consumo.controller.js";

const consumoRouter = Router();
const consumoController = new ConsumoController();

// HU-R8: Registro de consumo
consumoRouter.post("/", consumoController.registrarConsumo);

// Consulta de historial de movimientos por tiquetera
consumoRouter.get("/tiquetera/:tiqueteraId", consumoController.obtenerHistorial);

export default consumoRouter;
