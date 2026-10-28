import { Router } from "express";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
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

routerMascota.get("/", async (_, res) => {
  try {
    return res.json(await leerJson("pets.json"));
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Error al leer los datos de las mascotas" });
  }
});

routerMascota.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const mascotas = await leerJson("pets.json");
    const mascota = mascotas.find((p) => p.id === id);
    if (!mascota) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }
    return res.json(mascota);
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Error al leer los datos de las mascotas" });
  }
});

routerMascota.post("/", async (req, res) => {
  try {
    const { especie, color, edad, sexo, img, duehno } = req.body;
    if (
      !especie ||
      !color ||
      !edad ||
      !sexo ||
      !Array.isArray(img) ||
      img.length === 0 ||
      !duehno
    ) {
      return res.status(400).json({ error: "Datos de la mascota incompletos" });
    }
    const duehnos = await leerJson("users.json");
    if (!duehnos.some((d) => duehno === d.id)) {
      return res.status(400).json({
        error: "No existe el dueño para esa mascota, primero crear el dueño",
      });
    }
    const mascotaNueva = new Mascota(especie, color, edad, sexo, img, duehno);
    const mascotas = await leerJson("pets.json");
    mascotas.push(mascotaNueva);

    await escribirJson("pets.json", mascotas);
    return res.status(201).json(mascotaNueva);
  } catch (e) {
    return res.status(500).json({ error: "Error al crear la mascota" });
  }
});

routerMascota.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let mascotas = await leerJson("pets.json");

    let mascotaEliminada = null;
    mascotas = mascotas.filter((m) => {
      if (m.id === id) {
        mascotaEliminada = m;
        return false;
      }
      return true;
    });
    if (mascotaEliminada == null) {
      return res.status(404).json({
        error: "No existe la mascota que desea eliminar",
      });
    }
    await escribirJson("pets.json", mascotas);
    return res.status(201).send(mascotaEliminada);
  } catch (e) {
    return res.status(500).json({ error: "Error al eliminar a la mascota" });
  }
});

async function leerJson(archivo) {
  const ruta = await obtenerRuta(archivo);
  const datos = await fs.readFile(ruta, "utf-8");
  return JSON.parse(datos);
}
async function obtenerRuta(archivo) {
  return path.join(__dirname, "..", "data", archivo);
}
async function escribirJson(archivo, datos) {
  const ruta = await obtenerRuta(archivo);
  await fs.writeFile(ruta, JSON.stringify(datos, null, 2), "utf-8");
}
export default routerMascota;
