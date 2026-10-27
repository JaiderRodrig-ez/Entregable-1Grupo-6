import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
//import { uploadUser } from '../middlewares/multer.middleware.js';
//import { hashPassword } from '../utils/crypto.js';


class User{
    constructor(nombre, apellidos, usuario, contrasenha, avatar){
        this.id = crypto.randomUUID();
        this.nombre = nombre;
        this.apellidos = apellidos;
        this.usuario = usuario;
        this.contrasenha = contrasenha;
        this.avatar = avatar;
    }
}

const router = Router();

router.get('/', (req, res) => {
  res.send('test');
});

export default router;