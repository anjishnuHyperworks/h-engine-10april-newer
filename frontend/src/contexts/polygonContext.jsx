import React, { createContext, useContext, useState, useEffect } from "react";
import { useSignIn } from '../contexts/signInContext';
import { decrypt } from "../connectors/decryption";

const PolygonContext = createContext();

export const PolygonContextProvider = ({ children }) => {

    const { signedIn, signedInUser, encryptionKey } = useSignIn();

    const [polygons, setPolygons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [activePolygons, setActivePolygons] = useState([]);

    useEffect(() => {
        const fetchPolygons = async () => {
            try {
                setLoading(true);
                const SERVER_URL = process.env.REACT_APP_SERVER_URL;
                
                const response = await fetch(`${SERVER_URL}/api/polygons`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'user_id': signedInUser.USER_ID,
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch polygons: ${response.status}`);
                }
                
                const encryptedData = await response.text();

                const decryptedText = decrypt(encryptedData, encryptionKey);

                const apiData = decryptedText;
                
                if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
                    throw new Error('No valid polygon data returned from API');
                }
                
                const formattedPolygons = apiData.map((polygon, index) => {
                    let formattedCoordinates;
                    
                    if (polygon.coordinates) {
                        if (Array.isArray(polygon.coordinates[0]) && 
                            Array.isArray(polygon.coordinates[0][0]) && 
                            Array.isArray(polygon.coordinates[0][0][0])) {
                            formattedCoordinates = [polygon.coordinates[0][0]];
                        } else if (Array.isArray(polygon.coordinates[0]) && 
                                    Array.isArray(polygon.coordinates[0][0])) {
                            formattedCoordinates = polygon.coordinates;
                        } else {
                            console.warn(`Unexpected coordinates format for polygon ${polygon.id}`);
                            formattedCoordinates = [[]];
                        }
                    } else {
                        formattedCoordinates = [[]];
                    }
                    
                    return {
                        id: polygon.id || (index + 1),
                        name: polygon.name,
                        coordinates: formattedCoordinates
                    };
                });
                
                setPolygons(formattedPolygons);
                
                if (formattedPolygons.length > 0) {
                    setActivePolygons([formattedPolygons[0]]);
                }
            } catch (err) {
                console.error("Error fetching polygons:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPolygons();
    }, [encryptionKey]);

    return (
        <PolygonContext.Provider value={{ 
            polygons, 
            activePolygons, 
            setActivePolygons,
            loading,
            error 
        }}>
            {children}
        </PolygonContext.Provider>
    );
};

export const usePolygons = () => {
    return useContext(PolygonContext);
};
