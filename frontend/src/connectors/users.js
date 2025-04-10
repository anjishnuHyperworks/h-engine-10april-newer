import { decrypt } from "../connectors/decryption";

const SERVER_URL = process.env.REACT_APP_SERVER_URL;

export async function add_user(user_id, encryptionKey, email, display_name, first_name, last_name, company, role, created_by) {
    const response = await fetch(`${SERVER_URL}/api/add-user`, {
        method: 'POST',
        body: JSON.stringify({ email, display_name, first_name, last_name, company, role, created_by }),
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}

export async function get_all_users(user_id, encryptionKey) {
    const response = await fetch(`${SERVER_URL}/api/get-all-users`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}

export async function delete_selected_users(user_id, encryptionKey, selected_users) {
    const response = await fetch(`${SERVER_URL}/api/delete-selected-users`, {
        method: 'DELETE',
        body: JSON.stringify({ selected_users }),
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}

export async function update_user(user_id, encryptionKey, editing_user_id, display_name, first_name, last_name, company, role, status, modified_by) {
    const response = await fetch(`${SERVER_URL}/api/update-user`, {
        method: 'PUT',
        body: JSON.stringify({ editing_user_id, display_name, first_name, last_name, company, role, status, modified_by }),
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}