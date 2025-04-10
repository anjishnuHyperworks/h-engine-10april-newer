import { decrypt } from "../connectors/decryption";

const SERVER_URL = process.env.REACT_APP_SERVER_URL;

export async function add_polygon(user_id, encryptionKey, polygon_name, polygon_mapper_id, polygon_parameters, created_by) {
    const response = await fetch(`${SERVER_URL}/api/add-polygon`, {
        method: 'POST',
        body: JSON.stringify({ polygon_name, polygon_mapper_id, polygon_parameters, created_by }),
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}

export async function get_all_polygons(user_id, encryptionKey) {
    const response = await fetch(`${SERVER_URL}/api/get-all-polygons`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}

export async function delete_selected_polygons(user_id, encryptionKey, selected_polygons) {
    const response = await fetch(`${SERVER_URL}/api/delete-selected-polygons`, {
        method: 'DELETE',
        body: JSON.stringify({ selected_polygons }),
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}

export async function update_polygon(user_id, encryptionKey, polygon_id, polygon_name, polygon_mapper_id, polygon_parameters, modified_by) {
    const response = await fetch(`${SERVER_URL}/api/update-polygon`, {
        method: 'PUT',
        body: JSON.stringify({ polygon_id, polygon_name, polygon_mapper_id, polygon_parameters, modified_by }),
        headers: {
            'Content-Type': 'application/json',
            'user_id': user_id,
        },
    });

    const encryptedData = await response.text();
    return decrypt(encryptedData, encryptionKey);
}