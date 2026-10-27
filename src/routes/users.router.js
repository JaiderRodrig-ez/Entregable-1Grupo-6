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
const usersFile = path.join(import.meta.dirname, '../data/users.json');

const leerUsers = async () => JSON.parse(await fs.readFile(usersFile, 'utf-8'));
const escUsers = (users) => fs.writeFile(usersFile, JSON.stringify(users, null, 2));

router.post('/', /*uploadUser.single('avatar') ,*/ async(req, res) => {
    try {
        const { firstname, lastname, username, password } = req.body ?? {};
        if (!firstname || !lastname || !username || !password) {
        if (req.file) await fs.unlink(req.file.path);
        return res.status(400).json({ error: 'Campos requeridos no enviados' });
        }

        const users = await leerUsers();

        //const passwordHash = hashPassword(password);
        const newUser = new User(
            firstname,
            lastname,
            username,
            password, 
            req.file ? `/img/users/${req.file.filename}` : null
        );

        users.push(newUser);
        await escUsers(users);

        const { password: _, ...userSinPassword } = newUser;
        res.status(201).json(userSinPassword);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


router.get('/', (req, res) => {
  res.send('test');
});

export default router;