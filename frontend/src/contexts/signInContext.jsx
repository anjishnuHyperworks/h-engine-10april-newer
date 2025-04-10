import React, { createContext, useContext, useState, useEffect } from "react";

import { fetchEncryptionKey } from '../connectors/indexedDB';

const signInContext = createContext();

export const SignInContextProvider = ({ children }) => {
    const [signedIn, setSignedIn] = useState(false);
    const [signedInUser, setSignedInUser] = useState(null);
    const [encryptionKey, setEncryptionKey] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("signedInUser");
        if (storedUser) {
            setSignedInUser(JSON.parse(storedUser));
            setSignedIn(true);
        }
    }, []);

    async function fetchAndSetEncryptionKey() {
        const aes_key = await fetchEncryptionKey();
        setEncryptionKey(aes_key);
    }

    useEffect(() => {
        if (signedInUser) {
            localStorage.setItem("signedInUser", JSON.stringify(signedInUser));
            setSignedIn(true);
            if (encryptionKey === null) {
                fetchAndSetEncryptionKey();
            }
        } else {
            localStorage.removeItem("signedInUser");
            setSignedIn(false);
        }
    }, [signedInUser]);

    return (
        <signInContext.Provider value={{ signedIn, setSignedIn, signedInUser, setSignedInUser, encryptionKey, setEncryptionKey }}>
            {children}
        </signInContext.Provider>
    );
};

export const useSignIn = () => {
    return useContext(signInContext);
};