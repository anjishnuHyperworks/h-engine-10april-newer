import React, { createContext, useContext, useState } from "react";
import CustomMessage from "../components/message"; 

const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
    const [message, setMessage] = useState(null);
    const [type, setType] = useState(null);

    const showMessage = (msg, msgType) => {
        setMessage(msg);
        setType(msgType);
        setTimeout(() => {
            setMessage(null);
        }, 3000); 
    };

    return (
        <MessageContext.Provider value={{ showMessage }}>
            {children}
            {message && <CustomMessage message={message} type={type} />}
        </MessageContext.Provider>
    );
};

export const useMessage = () => {
    return useContext(MessageContext);
};
