import { Router } from "express";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mascotasJson = path.join(__dirname, "..", "data", "pets.json");
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
  res.sendFile(mascotasJson);
});

routerMascota.get("/:id", (req, res) => {});
export default routerMascota;
