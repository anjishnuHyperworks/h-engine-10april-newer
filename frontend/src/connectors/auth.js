import { decrypt } from "../connectors/decryption";
import { deleteKeysFromIndexedDB } from "../connectors/indexedDB";

const SERVER_URL = process.env.REACT_APP_SERVER_URL;

export async function login(email, password, login_location) {
    const response = await fetch(`${SERVER_URL}/api/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password, login_location }),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return response;
}

export async function logout(user_id) {
    const response = await fetch(`${SERVER_URL}/api/logout`, {
        method: 'POST',
        body: JSON.stringify({ user_id }),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (response.ok) {
        await deleteKeysFromIndexedDB(user_id);
    }

    const responseData = await response.json();
    console.log('Logout response:', responseData);
    localStorage.setItem('logout_response', JSON.stringify(responseData)); // Store parsed JSON

    return responseData;
}

export async function change_password(user_id, encryptionKey, email, new_password) {
    const response = await fetch(`${SERVER_URL}/api/change-password`, {
        method: 'PUT',
        body: JSON.stringify({ email, new_password }),
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}

export async function get_user_email_and_status(user_id, encryptionKey) {
    const response = await fetch(`${SERVER_URL}/api/get-user-email-and-status`, {
        method: 'POST',
        body: JSON.stringify({ user_id }),
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}

export async function send_otp(user_id, encryptionKey, email) {
    const response = await fetch(`${SERVER_URL}/api/send-otp`, {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}