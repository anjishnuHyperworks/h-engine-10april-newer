import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

function CustomMessage({ message, type, onClose }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    if (!visible) return null;

    return (
        <div className="flex items-center gap-4 p-4 bg-white text-contrast rounded-lg fixed bottom-4 right-4 shadow-md max-w-[50vw]">
            <FontAwesomeIcon icon={type === 'success' ? faCheckCircle : faExclamationCircle} className={type === 'success' ? 'text-success' : 'text-error'} />
            <p className={type === 'success' ? 'text-success_text' : 'text-error_text'}>{message}</p>

            <div className="absolute bottom-0 left-0 h-1 bg-gray-300 w-full">
                <div className={`h-full ${type === 'success' ? 'bg-success_text' : 'bg-error_text'} message-progress-bar`}></div>
            </div>
        </div>
    );
}

export default CustomMessage;
