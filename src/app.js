import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import routerMascota from "./routes/pets.router.js";
import usersRouter from "./routes/users.router.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use("/users", usersRouter);
app.use("/api/pets", routerMascota);

app.get("/", (_req, res) => {
  res.send("");
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(400).json({ error: err.message || "Error en la petición" });
});

app.listen(PORT, () => {
  console.log(`Escuchando en http://localhost:${PORT}`);
});
