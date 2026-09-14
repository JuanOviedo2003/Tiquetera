import { Router } from "express";
import RejillaController from "./rejilla.controller.js";

const rejillaRouter = Router();
const rejillaController = new RejillaController();

// HU-R7: GET /api/rejilla/:qrToken -> rejilla de almuerzos + saldo
rejillaRouter.get("/:qrToken", rejillaController.obtenerRejilla);

export default rejillaRouter;
