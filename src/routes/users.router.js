import { Router } from 'express';
import crypto from "node:crypto"
import fs from 'node:fs/promises';
import path from 'node:path';
//import { uploadUser } from '../middlewares/multer.middleware.js';
import { hashPassword } from '../utils/crypto.js';

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
        const { nombre, apellidos, usuario, contrasenha } = req.body ?? {};
        if (!nombre || !apellidos || !usuario || !contrasenha) {
        if (req.file) await fs.unlink(req.file.path);
        return res.status(400).json({ error: 'Campos requeridos no enviados' });
        }

        const users = await leerUsers();

        const passwordHash = hashPassword(contrasenha);
        const newUser = new User(
            nombre,
            apellidos,
            usuario,
            passwordHash, /* passwordHash*/
            req.file ? `/img/users/${req.file.filename}` : null
        );

        users.push(newUser);
        await escUsers(users);

        const { contrasenha: _, ...userSinPassword } = newUser;
        res.status(201).json(userSinPassword);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await leerUsers();
        const usersSinPassword = users.map(({ contrasenha : _, ...rest }) => rest);
        res.status(200).json(usersSinPassword);
    } catch(error) {
        res.status(500).json({error : 'Error interno del servidor'});

    }
});

router.get('/:id', async (req, res) => {
    try {
        const users = await leerUsers();
        const user = users.find((u) => u.id === req.params.id);

        if (!user) {
            return res.status(404).json({error : 'Usuario no encontrado'});
        }

        const {contrasenha : _, ...userSinPass} = user;
        res.status(200).json(userSinPass);

    } catch(error) {
        res.status(500).json({error : 'Error interno del servidor'});
    }

});

router.delete('/:id', async (req, res) => {
    try {

        const { id } = req.params;
        
        const users = await leerUsers();
    
        const newUsers = users.filter(u => u.id !== id);

        if (newUsers.length === users.length) {
            return res.status(404).json({error : 'Usuario no encontrado'});
        }


        await escUsers(newUsers);
        res.status(200).json({message : 'Usuario eliminado'});

    } catch(error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.put('/:id', /* uploadUser.single('avatar'), */ async(req, res) => {
    try {

        const { id } = req.params;
        const { nombre, apellidos, usuario,  contrasenha} = req.body ?? {};
        const users = await leerUsers();
        const user = users.find(u => u.id === id);

        if (!user) {
            if(req.file) await fs.unlink(req.file.path);
            return res.status(400).json({error : 'Usuario no encontrado'});
        }
        
        if (!nombre && !apellidos && !usuario && !contrasenha){
            return res.status(400).json({error : 'No se enviaron datos para actualizar'});
        }
        
        if (nombre) user.nombre = nombre;
        if (apellidos) user.apellidos = apellidos;
        if (usuario) user.usuario = usuario;
        if (contrasenha){
            const hashContrasenha = hashPassword(contrasenha);
            //user.contrasenha = contrasenha;
            user.contrasenha = hashContrasenha;
        }
        if (req.file) {
            if (user.avatar) {
                const oldPath = path.join(import.meta.dirname, '../../public', user.avatar);
                await fs.unlink(oldPath).catch(() => {});
            }
            user.avatar = `/img/users/${req.file.filename}`;
        }
        await escUsers(users);
        const {contrasenha : _, ...userSinPass} = user;
        return res.status(200).json(userSinPass);
    } catch(error){
        res.status(500).json({error : 'Error interno del servidor'});
    }
});

export default router;