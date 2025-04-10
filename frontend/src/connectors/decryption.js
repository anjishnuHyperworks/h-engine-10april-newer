import forge from 'node-forge';

export const decrypt = (encryptedData, AES_KEY) => {

    if (!AES_KEY) {
        throw new Error("AES_KEY is required for decryption");
    }
    if (!encryptedData) {
        throw new Error("Encrypted data is required");
    }

    const keyBuffer = forge.util.createBuffer(forge.util.decode64(AES_KEY), 'raw');

    const encryptedBytes = forge.util.decode64(encryptedData);
    const encryptedBuffer = forge.util.createBuffer(encryptedBytes, 'raw');

    const iv = encryptedBuffer.getBytes(16);
    const encryptedText = encryptedBuffer.getBytes();

    const decipher = forge.cipher.createDecipher('AES-CBC', keyBuffer);
    decipher.start({ iv });
    decipher.update(forge.util.createBuffer(encryptedText, 'raw'));
    const success = decipher.finish();

    if (!success) {
        throw new Error("Decryption failed");
    }

    const decryptedText = decipher.output.toString('utf8');

    try {
        const parsedJSON = JSON.parse(decryptedText);
        return parsedJSON;
    } catch {
        return decryptedText;
    }
};
