import { Router } from "express";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import {promises as fs} from "fs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const routerMascota = Router();

class Mascota {
  constructor(especie, color, edad, sexo, img, duehno) {
    this.id = randomUUID();
    this.especie = especie;
    this.color = color;
    this.edad = edad;
    this.sexo = sexo;
    this.img = img;
    this.duehno = duehno;
  }
}

routerMascota.get("/", (_, res) => {
  try {
    const mascotasJson = path.join(__dirname, "..", "data", "pets.json");
    res.sendFile(mascotasJson);
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Error al leer los datos de las mascotas" });
  }
});

routerMascota.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const mascotasJson = path.join(__dirname, "..", "data", "pets.json");
    const datos = await fs.readFile(mascotasJson, "utf-8");
    const mascotas = JSON.parse(datos);
    const mascota = mascotas.find((p) => p.id === id);
    if (!mascota) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }
    res.json(mascota);
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Error al leer los datos de las mascotas" });
  }
});

export default routerMascota;
