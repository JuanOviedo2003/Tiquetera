import { Router } from "express";
import ConsumoController from "../controllers/consumo.controller.js";

const consumoRouter = Router();
const consumoController = new ConsumoController();

// HU-R8: Registro de consumo
consumoRouter.post("/", consumoController.registrarConsumo);

// HU-R9: Corrección de consumo del mismo día (reversa)
consumoRouter.post("/reversa", consumoController.revertirConsumo);

// HU-R10: Consulta de historial de movimientos por tiquetera
consumoRouter.get("/tiquetera/:tiqueteraId", consumoController.obtenerHistorial);

export default consumoRouter;
