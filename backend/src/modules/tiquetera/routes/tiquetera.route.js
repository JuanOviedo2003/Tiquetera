import { Router } from "express";
import TiqueteraController from "../controllers/tiquetera.controller.js";

const tiqueteraRouter = Router();
const tiqueteraController = new TiqueteraController();

// HU-R3: Creación de tiquetera
tiqueteraRouter.post("/", tiqueteraController.crear);

// HU-R4: Consulta y filtrado general
tiqueteraRouter.get("/", tiqueteraController.listar);

// HU-C1 & HU-C2: Activación desde cliente (código + PIN)
tiqueteraRouter.post("/activar", tiqueteraController.activar);

// HU-R6: Validación de PIN del cliente
tiqueteraRouter.post("/validar-pin", tiqueteraController.validarPin);

// HU-C3: Regeneración de PIN por parte del cliente
tiqueteraRouter.post("/regenerar-pin", tiqueteraController.regenerarPin);

// HU-C4 & HU-C5: Vista pública de saldo e historial del cliente (solo lectura sin cuenta)
tiqueteraRouter.get("/public/qr/:qrToken", tiqueteraController.obtenerVistaPublica);

// HU-R5: Apertura de tiquetera por QR
tiqueteraRouter.get("/qr/:qrToken", tiqueteraController.obtenerPorQr);

// SUPER_ADMIN: Consultar PINes y trazabilidad de cambios de PIN
tiqueteraRouter.get("/admin/pines", tiqueteraController.adminObtenerPines);

// HU-R12: Entrega de código de activación
tiqueteraRouter.get("/:id/codigo-activacion", tiqueteraController.obtenerCodigoActivacion);

// HU-R6: Validación de PIN por ID de tiquetera
tiqueteraRouter.post("/:id/validar-pin", tiqueteraController.validarPin);

// Reemisión de código
tiqueteraRouter.post("/:id/reemitir-codigo", tiqueteraController.reemitirCodigo);

// SUPER_ADMIN: Cambiar PIN y estado de cualquier tiquetera
tiqueteraRouter.put("/:id/admin-pin", tiqueteraController.adminCambiarPin);
tiqueteraRouter.put("/:id/estado", tiqueteraController.adminCambiarEstado);

// Consulta por ID
tiqueteraRouter.get("/:id", tiqueteraController.obtenerPorId);

// Eliminación de tiquetera (PENDIENTE/FINALIZADA o cualquiera con ?admin=true)
tiqueteraRouter.delete("/:id", tiqueteraController.eliminar);

export default tiqueteraRouter;
