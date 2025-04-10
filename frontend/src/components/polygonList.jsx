import React from "react";
import { useState, useEffect } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';

import { usePolygons } from "../contexts/polygonContext";

function LoadPolygonList() {

    const [collapsed, setCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const polygons = usePolygons().polygons;
    const { activePolygons, setActivePolygons } = usePolygons();

    useEffect(() => {
        if (polygons) {
            setSearchResults(polygons);
        }
    }, []);

    useEffect(() => {
        if (searchTerm === '') {
            setSearchResults(polygons);
            return;
        }
        const result = polygons.filter(polygon =>
            polygon.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(result);
    }, [searchTerm, polygons]);

    const handlePolygonClick = (event, polygon) => {
        event.stopPropagation();
        setActivePolygons([polygon])
    }

    const handleCheckBoxClick = (event, polygon) => {
        event.stopPropagation();
        setActivePolygons((prevActivePolygons) => {
            const updatedPolygons = prevActivePolygons.some((p) => p.id === polygon.id)
                ? prevActivePolygons.filter((p) => p.id !== polygon.id)
                : [...prevActivePolygons, polygon];
    
                return updatedPolygons;
            });
    };

    return (
        <div className="w-full bg-white text-black border border rounded-lg overflow-hidden">
            <div className="border-b flex items-center justify-between p-2 gap-2">
                <h1 className="text-l text-center font-semibold">Polygons</h1>
            
                <button className="p-2 flex justify-center items-center bg-secondary hover:bg-accent rounded-lg"
                        onClick={() => setCollapsed(!collapsed)}>
                    <FontAwesomeIcon icon={collapsed?(faCaretDown):(faCaretUp)} className="text-l text-contrast" />
                </button>
            </div>

            {!collapsed && (
                <>
                    <div className="w-full flex items-center p-2 relative">
                        <input type="text"
                            placeholder="Search..."
                            className="w-full bg-primary border px-2 py-1 text-contrast focus:outline-none rounded-lg"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute text-l text-contrast right-4" />
                    </div>

                    <div>
                        {searchResults.map((polygon, index) => (
                            <div key={polygon.id} className="flex items-center gap-2 p-2 hover:bg-hover_contrast" onClick={(e) => handlePolygonClick(e, polygon)}>
                                <input 
                                    type="checkbox" 
                                    id={`polygon_${polygon.id}`} 
                                    name="polygon" 
                                    checked={activePolygons.some((p) => p.id === polygon.id)}
                                    className="w-[1rem] h-[1rem] accent-contrast rounded-lg"
                                    onClick={(e) => handleCheckBoxClick(e, polygon)}
                                    readOnly
                                />
                                <label 
                                    htmlFor={`polygon_${polygon.id}`} 
                                    className="text-base w-full leading-none flex items-center pointer-events-none"
                                >
                                    {polygon.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </>
            )}

        </div>
    );
}

export default LoadPolygonList;