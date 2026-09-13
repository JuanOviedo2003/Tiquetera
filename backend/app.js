import express from "express";
import cors from "cors";
import userRouter from "./src/modules/user/routes/user.route.js";
import tiqueteraRouter from "./src/modules/tiquetera/routes/tiquetera.route.js";
import consumoRouter from "./src/modules/consumo/routes/consumo.route.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.use("/api/users", userRouter);
app.use("/api/tiqueteras", tiqueteraRouter);
app.use("/api/consumos", consumoRouter);

app.use((req, res) => {
	res.status(404).json({ error: "Ruta no encontrada" });
});

const isTestEnvironment =
	process.env.NODE_ENV === "test" ||
	process.execArgv.includes("--test") ||
	process.argv.some((arg) => arg.includes("test"));

let server = null;
if (!isTestEnvironment) {
	server = app.listen(port, () => {
		console.log(`App listening in port: http://localhost:${port}/`);
	});

	server.on("error", (error) => {
		console.error("No se pudo iniciar el servidor:", error.message);
		process.exitCode = 1;
	});
}

export { app, server };
export default app;