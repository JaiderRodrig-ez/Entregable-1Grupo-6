import crypto from "node:crypto"
import { buffer } from "node:stream/consumers";

//console.log(crypto.getCiphers());

const algoritmo = 'aes-256-cbc';
const key = crypto.randomBytes(32);


const iv = crypto.randomBytes(16);

console.log(key);

console.log(iv);
//const contrasena = 'pepapig1234';

const hashPassword = (contrasena) =>{
    const cipher = crypto.createCipheriv(algoritmo, key, iv);
    const passwordEncripted = Buffer.concat([cipher.update(contrasena), cipher.final()]);
    return{
        iv: iv.toString("hex"),
        encripted: passwordEncripted.toString("hex")
    }
}

//console.log(hashPassword(contrasena));
const desencriptar = (contrasena) =>{
    const iv = Buffer.from(contrasena.iv, "hex");
    const valor = Buffer.from(contrasena.encripted, "hex");

    const  contrasenaDesencripted = crypto.createDecipheriv(algoritmo, key, iv);

    return Buffer.concat([contrasenaDesencripted.update(valor), contrasenaDesencripted.final()]).toString()
}

//console.log(desencriptar(hashPassword(contrasena)));