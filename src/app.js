import express from "express";
import routerMascota from "./routes/pets.router.js";
const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/api/pets", routerMascota);


app.get('/', (_, res) => {
  res.send('')
})


app.listen(PORT, () => {
  console.log(`Escuchando en http://localhost:${PORT}`);
});
