"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Encryptor = void 0;
// EncryptionClient.ts
const crypto_1 = require("crypto");
class Encryptor {
    constructor(password) {
        this.remotePublicKey = '';
        this.algorithm = 'aes-256-cbc';
        if (password) {
            this.password = password;
        }
        else {
            this.password = 'bumoyu123';
        }
        // Generate RSA key pair
        const { publicKey, privateKey } = (0, crypto_1.generateKeyPairSync)('rsa', {
            modulusLength: 2048,
        });
        this.publicKey = publicKey.export({ type: 'spki', format: 'pem' }).toString();
        this.privateKey = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
        let salt = this.generateSalt();
        this.simpleKey = (0, crypto_1.scryptSync)(this.password, salt, 32); // Generate a key from the password
        this.simpleVi = (0, crypto_1.randomBytes)(16); // Initialization vector
    }
    generateSalt(length = 16) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
        let salt = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            salt += charset[randomIndex];
        }
        return salt;
    }
    setSimple(combinedBase64String) {
        this.simpleKey = Buffer.from(combinedBase64String.split(":")[0], 'base64');
        this.simpleVi = Buffer.from(combinedBase64String.split(":")[1], 'base64');
    }
    encrypt(text, key, iv) {
        const cipher = (0, crypto_1.createCipheriv)(this.algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted; //encrypted; // Return encrypted text
    }
    decrypt(encryptedText, key, iv) {
        const decipher = (0, crypto_1.createDecipheriv)(this.algorithm, key, iv);
        let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    encryptWithPublicKey(data, remotePublicKey) {
        const encryptedData = (0, crypto_1.publicEncrypt)(remotePublicKey, Buffer.from(data, 'base64'));
        return encryptedData.toString('base64'); // Return base64 encoded string
    }
    decryptWithPrivateKey(encryptedData) {
        const decryptedData = (0, crypto_1.privateDecrypt)(this.privateKey, Buffer.from(encryptedData, 'base64'));
        return decryptedData.toString('base64'); // Return decrypted string
    }
    finalEncrypt(text, remotePublicKey) {
        const that = this;
        let salt = this.generateSalt();
        let key = (0, crypto_1.scryptSync)(that.password, salt, 32); // Generate a key from the password
        let iv = (0, crypto_1.randomBytes)(16); // Initialization vector
        let d_send = that.encrypt(text, key, iv);
        let k_send = that.encryptWithPublicKey(key.toString('base64'), remotePublicKey);
        let i_send = iv.toString('base64');
        let data = {
            d: d_send,
            k: k_send,
            i: i_send
        };
        return data;
    }
    finalDecrypt(data) {
        const { d, k, i } = data;
        let k_receive = this.decryptWithPrivateKey(k);
        let i_receive = Buffer.from(i, 'base64');
        let d_receive = this.decrypt(d, Buffer.from(k_receive, 'base64'), i_receive); //decrypt(d, k_receive, i_receive)
        return d_receive;
    }
    simpleEncrypt(text) {
        const that = this;
        let d_send = that.encrypt(text, this.simpleKey, this.simpleVi);
        return d_send;
    }
    simpleDecrypt(encryptedText) {
        const that = this;
        let d_receive = that.decrypt(encryptedText, this.simpleKey, this.simpleVi);
        return d_receive;
    }
}
exports.Encryptor = Encryptor;
// let encryptor = new Encryptor('testPassword123');
// encryptor.setSimple("B9EMizUe2tP3dqu8GlX3amO3uERua9HhPVqANMWyXUY=:0y7LOFmW415sBKGUQ5A0Fg==")
// console.log(encryptor.simpleEncrypt("1526"))
// console.log(encryptor.simpleDecrypt(encryptor.simpleEncrypt("1526")))
