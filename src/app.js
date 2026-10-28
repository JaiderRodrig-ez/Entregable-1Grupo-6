import express from "express";
import routerMascota from "./routes/pets.router.js";
import { fileURLToPath } from "url";
const app = express();
const PORT = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use("/api/pets", routerMascota);


app.get('/', (_, res) => {
  res.send('')
})


app.listen(PORT, () => {
  console.log(`Escuchando en http://localhost:${PORT}`);
});
