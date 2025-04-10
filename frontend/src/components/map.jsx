import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand, faExpandAlt, faDownLeftAndUpRightToCenter } from '@fortawesome/free-solid-svg-icons';
import { usePolygons } from "../contexts/polygonContext";
import { MapSection } from "../helpers/billyMapSection"; // Updated import

function LoadMap() {
    const { activePolygons } = usePolygons(); 
    
    const [layerControlVisible, setLayerControlVisible] = useState(false);
    const [layerStates, setLayerStates] = useState({
        raster1: true,
        raster2: true
    });
    
    const selectedPolygon = activePolygons.length > 0 
        ? activePolygons[activePolygons.length - 1] 
        : null;
    
    const toggleLayer = (layerName) => {
        setLayerStates(prev => ({
            ...prev,
            [layerName]: !prev[layerName]
        }));
    };
    
    return (
        <div className="h-[60vh] w-full flex flex-col rounded-lg border border bg-white">
            <div className="border-b flex items-center justify-between p-2 gap-2 w-full">
                <h1 className="text-l text-center text-contrast font-semibold">
                    OpenLayers Map
                </h1>

                <div className="flex gap-2">
                    <button 
                        className="p-2 bg-secondary hover:bg-accent rounded-lg flex justify-center items-center"
                    >
                        <FontAwesomeIcon icon={faExpand} className="text-contrast" />
                    </button>
                </div>
            </div>

            <div className="h-full w-full items-center p-2">
                <div className="bg-gray-100 h-full w-full rounded-md justify-center items-center flex relative">
                    <div className="flex flex-col absolute z-50 top-2 right-2 bg-primary rounded-lg text-contrast">
                        <div className="text-sm font-semibold border-b p-2 flex justify-between items-center gap-10">
                            <h1>Layer Control</h1>
                            <FontAwesomeIcon icon={layerControlVisible?faDownLeftAndUpRightToCenter:faExpandAlt} className="text-contrast p-1" onClick={() => setLayerControlVisible(!layerControlVisible)}/>
                        </div>

                        {layerControlVisible && (
                            <div className="flex flex-col gap-2 p-2">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        id="raster1-toggle" 
                                        checked={layerStates.raster1}
                                        onChange={() => toggleLayer('raster1')}
                                        className="accent-accent"
                                    />
                                    <label htmlFor="raster1-toggle" className="text-sm font-medium">
                                        Raster Layer 1
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        id="raster2-toggle" 
                                        checked={layerStates.raster2}
                                        onChange={() => toggleLayer('raster2')}
                                        className="accent-accent"
                                    />
                                    <label htmlFor="raster2-toggle" className="text-sm font-medium">
                                        Raster Layer 2
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <MapSection layerStates={layerStates} />
                </div>
            </div>
        </div>
    );
}

export default LoadMap;