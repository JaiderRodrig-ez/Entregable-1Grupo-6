import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAIZ_IMG = path.join(__dirname, "../../public/img");

const crearUpload = (subcarpeta) => {
  const destino = path.join(RAIZ_IMG, subcarpeta);
  fs.mkdirSync(destino, { recursive: true });

  const almacenamiento = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destino);
    },
    filename: (_req, file, cb) => {
      const nombreLimpio = file.originalname.replace(/\s+/g, "_");
      cb(null, `${Date.now()}-${nombreLimpio}`);
    },
  });

  return multer({
    storage: almacenamiento,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const permitidos = ["image/png", "image/jpeg", "image/webp"];
      if (permitidos.includes(file.mimetype)) cb(null, true);
      else cb(new Error("Solo se permiten imágenes PNG, JPG o WEBP"));
    },
  });
};

export const subirAvatar = crearUpload("users");
export const subirMascota = crearUpload("pets");
