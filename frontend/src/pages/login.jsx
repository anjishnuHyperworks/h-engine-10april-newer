import FloatingLabelInput from "../components/floatingLabelInput";
import { useState, useEffect } from "react";

import { login } from "../connectors/auth";
import { useMessage } from "../contexts/messageContext"; 
import { useSignIn } from "../contexts/signInContext";
import LoadLoader from "../components/loading";
import GetLocation from "../components/location";

import { storeKeysInIndexedDB } from "../connectors/indexedDB";

const forge = require('node-forge');

function decryptPrivateKey(encryptedPrivateKey, password, salt, iv) {

    const saltBuffer = forge.util.decode64(salt);
    const ivBuffer = forge.util.decode64(iv);

    const key = forge.pkcs5.pbkdf2(password, saltBuffer, 10000, 32);

    const decipher = forge.cipher.createDecipher('AES-CBC', key);
    decipher.start({ iv: ivBuffer });
    decipher.update(forge.util.createBuffer(forge.util.decode64(encryptedPrivateKey)));
    decipher.finish();

    return decipher.output.toString();
}

function decryptAESKeyWithPrivateKey(encryptedAESKey, privateKey) {
    try {
        const encryptedBytes = forge.util.decode64(encryptedAESKey);  
        const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
        const decryptedBytes = privateKeyObj.decrypt(encryptedBytes, 'RSA-OAEP');
        return forge.util.encode64(decryptedBytes); 
    } catch (error) {
        console.error('Error decrypting AES key:', error);
        throw new Error('Failed to decrypt AES key');
    }
}

function LoadLogin() {
    const { showMessage } = useMessage();
    const { setSignedIn, setSignedInUser, signedInUser, encryptionKey, setEncryptionKey } = useSignIn();
    const [loading, setLoading] = useState(true);
    const [assetsLoaded, setAssetsLoaded] = useState({
        iframe: false,
        logo: false,
    });

    const getLocationTracker = GetLocation();

    useEffect(() => {
        if (assetsLoaded.iframe && assetsLoaded.logo) {
            setLoading(false);
        }
    }, [assetsLoaded]);

    const handleAssetLoad = (asset) => {
        setAssetsLoaded(prev => ({ ...prev, [asset]: true }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const email = document.querySelector('input[name="login-email"]').value;
        const password = document.querySelector('input[name="login-password"]').value;

        if (email === "" || password === "") {
            showMessage("Please fill in all fields", "error");
            return;
        }

        setLoading(true);
        
        try {
            const login_location = await getLocationTracker();

            const res = await login(email, password, login_location);
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Unknown error occurred');
            }

            const data = await res.json();
            showMessage('Login successful', 'success');
            setSignedIn(true);
            
            if (data.STATUS.toLowerCase() === 'pending') {
                window.location.href = `/complete-signup?for=${data.USER_ID}`;
                return;
            }

            const encryption_keys = data.ENCRYPTION_KEYS;
            const salt = encryption_keys.salt;
            const iv = encryption_keys.iv;
            const encryptedPrivateKey = encryption_keys.privateKey;
            const decryptedPrivateKey = decryptPrivateKey(encryptedPrivateKey, password, salt, iv);
            const accessKey = encryption_keys.accessKey;
            
            const decryptedAESKey = decryptAESKeyWithPrivateKey(accessKey, decryptedPrivateKey);
            
            storeKeysInIndexedDB(decryptedAESKey);
            setEncryptionKey(decryptedAESKey);

            delete data.ENCRYPTION_KEYS;
            
            setSignedInUser(data);
            // window.location.href = data.ROLE.toLowerCase() === 'admin' ? '/admin-dashboard' : '/dashboard';

        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen w-full bg-primary">
            {loading && <LoadLoader />}
            
            <div className={`flex rounded-lg w-1/2 max-w-[60vw] bg-white h-[60%] ${loading ? "hidden" : "block"}`}>
                <div className="flex flex-col w-1/2 overflow-hidden rounded-tl-lg rounded-bl-lg relative">
                    <div className="h-full relative overflow-hidden">
                        <img
                            src="/texture.jpg"
                            className="w-full h-full object-cover"
                            onLoad={() => handleAssetLoad("iframe")}
                        />
                    </div>

                    <img 
                        src="/koloma-logo.png" 
                        alt="koloma-logo" 
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[25%] h-auto max-w-1/2 max-h-1/2"
                        onLoad={() => handleAssetLoad("logo")}
                    />
                </div>


                <div className="p-5 flex flex-col gap-10 w-1/2 rounded-tr-lg rounded-br-lg justify-between items-center">
                    <div className="flex justify-center items-center w-full flex-1">
                        <h1 className="uppercase font-bold text-2xl">Login</h1>
                    </div>

                    <div className="flex flex-col gap-6 w-full flex-1">
                        <FloatingLabelInput label="Email ID" type="text" name="login-email" />
                        <FloatingLabelInput label="Password" type="password" name="login-password" />
                    
                        <button className="p-2 text-primary bg-contrast rounded-md w-full" onClick={handleLogin}>
                            Login
                        </button>

                        <a href="/forgot-password" className="text-contrast text-sm underline w-full text-center p-3">
                            Forgot password?
                        </a>
                    </div>

                    <span className="flex-1"></span>
                </div>
            </div>
        </div>
    );
}

export default LoadLogin;