const bcrypt = require('bcrypt');
const crypto = require('crypto');
const forge = require('node-forge');

function deriveKey(createdAt) {
    return crypto.createHash('sha256').update(createdAt).digest('hex').slice(0, 32); // 32-byte key for AES-256
}

async function hashString(password) {
    const saltRounds = 10; 
    return await bcrypt.hash(password, saltRounds);
}

function encryptHashedPassword(hashedPassword, createdAt) {
    const secretKey = deriveKey(createdAt);
    const iv = crypto.randomBytes(16); 
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
    
    let encrypted = cipher.update(hashedPassword, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
}

function decryptHashedPassword(encryptedPassword, createdAt) {
    const secretKey = deriveKey(createdAt);
    const [ivHex, encrypted] = encryptedPassword.split(':');

    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), Buffer.from(ivHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

async function generateHashedAndEncryptedPassword(password, createdAt) {
    const hashedPassword = await hashString(password); // Await the hashing function
    return encryptHashedPassword(hashedPassword, createdAt);
}

// -------------------- RSA ENCRYPTION --------------------

function generateRSAKeys() {
    return crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
}

function generateAESKey() {
    const key = forge.random.getBytesSync(32);  
    return forge.util.encode64(key); 
}

function encryptPrivateKey(privateKey, password) {
    const salt = forge.random.getBytesSync(16);  
    const iv = forge.random.getBytesSync(16); 

    const key = forge.pkcs5.pbkdf2(password, salt, 10000, 32);

    const cipher = forge.cipher.createCipher('AES-CBC', key);
    cipher.start({ iv: iv });
    cipher.update(forge.util.createBuffer(privateKey));
    cipher.finish();

    const encryptedPrivateKey = forge.util.encode64(cipher.output.getBytes());

    return {
        privateKey: encryptedPrivateKey, 
        iv: forge.util.encode64(iv), 
        salt: forge.util.encode64(salt)
    };
}

function encryptAESKeyWithPublicKey(aesKey, publicKey) {
    const bufferData = forge.util.decode64(aesKey); // Convert Base64 string back to bytes
    const encryptedData = forge.pki.publicKeyFromPem(publicKey).encrypt(bufferData, 'RSA-OAEP');
    return forge.util.encode64(encryptedData); // Convert back to Base64 for transmission
}

const encrypt = (data, AES_KEY) => {
    if (!AES_KEY) {
        throw new Error("AES_KEY is required for encryption");
    }

    const keyBuffer = forge.util.decode64(AES_KEY);

    const text = typeof data === "string" ? data : JSON.stringify(data);
    
    const iv = forge.random.getBytesSync(16);
    const cipher = forge.cipher.createCipher('AES-CBC', keyBuffer);
    
    cipher.start({ iv });
    cipher.update(forge.util.createBuffer(text, 'utf8'));
    cipher.finish();

    const encrypted = forge.util.encode64(iv + cipher.output.getBytes());
    return encrypted;

};

module.exports = { 
    generateHashedAndEncryptedPassword, 
    decryptHashedPassword, 
    hashString, 
    generateAESKey, 
    generateRSAKeys, 
    encryptPrivateKey, 
    encryptAESKeyWithPublicKey ,
    encrypt
};