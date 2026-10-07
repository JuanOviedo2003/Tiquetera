import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import "./src/config/database.js";
import { connectPrisma } from "./src/config/prisma.js";
import userRouter from "./src/modules/user/routes/user.route.js";
import clienteRouter from "./src/modules/cliente/routes/cliente.route.js";
import tiqueteraRouter from "./src/modules/tiquetera/routes/tiquetera.route.js";
import consumoRouter from "./src/modules/consumo/routes/consumo.route.js";
import loginRouter from "./src/modules/login/login.route.js";
import rejillaRouter from "./src/modules/rejilla/rejilla.route.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/users", userRouter);
app.use("/api/clientes", clienteRouter);
app.use("/api/tiqueteras", tiqueteraRouter);
app.use("/api/consumos", consumoRouter);
app.use("/api/login", loginRouter);
app.use("/api/rejilla", rejillaRouter);

// Servir frontend estático compilado en producción si está disponible
const potentialDistPaths = [
    path.resolve(process.cwd(), "frontend/dist"),
    path.resolve(process.cwd(), "../frontend/dist"),
    path.resolve(import.meta.dirname, "../frontend/dist"),
    path.resolve(import.meta.dirname, "../../frontend/dist"),
];
const distPath = potentialDistPaths.find((p) => fs.existsSync(p));
if (distPath) {
    app.use(express.static(distPath));
    app.use((req, res, next) => {
        if (req.method === "GET" && !req.path.startsWith("/api") && req.path !== "/health") {
            return res.sendFile(path.join(distPath, "index.html"));
        }
        next();
    });
}

app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

const isTestEnvironment =
    process.env.NODE_ENV === "test" ||
    process.execArgv.includes("--test") ||
    process.argv.some((arg) => arg.includes("test"));

let server = null;
if (!isTestEnvironment) {
    server = app.listen(port, async () => {
        console.log(`App listening in port: http://localhost:${port}/`);
        await connectPrisma();
    });

    server.on("error", (error) => {
        console.error("No se pudo iniciar el servidor:", error.message);
        process.exitCode = 1;
    });
}

export { app, server };
export default app;
