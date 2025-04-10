import { decrypt } from "../connectors/decryption";

const SERVER_URL = process.env.REACT_APP_SERVER_URL;

export async function add_parameter(user_id, encryptionKey, parameter_name, parameter_unit, parameter_type, created_by) {
    const response = await fetch(`${SERVER_URL}/api/add-parameter`, {
        method: 'POST',
        body: JSON.stringify({ parameter_name, parameter_unit, parameter_type, created_by }),
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}

export async function get_all_parameters(user_id, encryptionKey) {
    const response = await fetch(`${SERVER_URL}/api/get-all-parameters`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}

export async function delete_selected_parameters(user_id, encryptionKey, selected_parameters) {
    const response = await fetch(`${SERVER_URL}/api/delete-selected-parameters`, {
        method: 'DELETE',
        body: JSON.stringify({ selected_parameters }),
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}

export async function update_parameter(user_id, encryptionKey, parameter_id, parameter_name, parameter_type, parameter_unit, status, modified_by) {
    const response = await fetch(`${SERVER_URL}/api/update-parameter`, {
        method: 'PUT',
        body: JSON.stringify({ parameter_id, parameter_name, parameter_type, parameter_unit, status, modified_by }),
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}

export async function get_parameters_for_polygon(user_id, encryptionKey, polygon_id) {
    const response = await fetch(`${SERVER_URL}/api/get-polygon-parameters`, {
        method: 'POST',
        body: JSON.stringify({ polygon_id }),
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}

export async function get_unique_values_for_string_parameters(user_id, encryptionKey) {
    const response = await fetch(`${SERVER_URL}/api/get-unique-values-for-string-parameters`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}
