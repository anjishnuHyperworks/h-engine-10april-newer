import React from "react";
import { useState, useEffect } from "react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';

import { usePolygons } from "../contexts/polygonContext";

function LoadParameterList() {

    const [collapsedStates, setCollapsedStates] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const { activePolygons } = usePolygons();

    useEffect(() => {
        if (searchTerm === '') {
            setSearchResults(preloadedParameters);
            return;
        }
        const result = preloadedParameters.filter(parameter =>
            parameter.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(result);
    }, [searchTerm]);

    const preloadedParameters = [
            {id: 1, name: 'S1', type: 'number', unit: 'Feet', defaultValue: 30000 },
            {id: 2, name: 'S2', type: 'number', unit: 'Acres', defaultValue: 18200000 },
            {id: 3, name: 'S3', type: 'range', unit: '%', defaultValue: 0.025 },
            {id: 4, name: 'R1', type: 'number', unit: 'Feet', defaultValue: 100 },
            {id: 5, name: 'R2', type: 'number', unit: 'Acres', defaultValue: 18200000 },
            {id: 6, name: 'R3', type: 'range', unit: '%', defaultValue: 0.1 },
            {id: 7, name: 'H1', type: 'number', unit: 'kg H₂/m³', defaultValue: 2.79 },
            {id: 8, name: 'W1', type: 'dropdown', unit: '', defaultValue: 'Sandstone', options: ['Sandstone', 'Carbonate', 'Freshwater', 'Mafic', 'Seawater'] },
            {id: 9, name: 'K', type: 'dropdown', unit: '', defaultValue: 'O', options: ['O', 'C', 'F', 'R', 'H'] },
            {id: 10, name: 'F', type: 'range', unit: '%', defaultValue: 0.08 },
            {id: 11, name: 'M1', type: 'dropdown', unit: '', defaultValue: 'Extrusive', options: ['Extrusive', 'Intrusive'] },
            {id: 12, name: 'L', type: 'dropdown', unit: '', defaultValue: 'Hydraulic Flush', options: ['Hydraulic Flush'] },
            {id: 13, name: 'A', type: 'number', unit: 'Years', defaultValue: 1000000000 },
            {id: 14, name: 'M', type: 'range', unit: '%', defaultValue: 0.5 },
            {id: 15, name: 'T', type: 'number', unit: '°C', defaultValue: 150 },
    ]

    const CustomInput = ({ parameter }) => {
        const [value, setValue] = useState(parameter.defaultValue);
    
        switch (parameter.type) {
            case "number":
                return <input type="number" className="border px-2 py-1 w-full rounded-lg focus:outline-accent" value={value} onChange={(e) => setValue(e.target.value)}/>;
            
            case "range":
                return (
                    <div className="flex items-center gap-2 w-full">
                        <input
                            type="range"
                            step="0.001"
                            min={0}
                            max={1}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full accent-contrast"
                        />
                        <span className="text-black">{Number(value).toFixed(3)}</span>
                    </div>
                );
        
            case "dropdown":
                return (
                    <select className="border p-1 w-full rounded-lg focus:outline-accent" value={value} onChange={(e) => setValue(e.target.value)}>
                        {parameter.options.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                        ))}
                    </select>
                );
        
            default:
                return <input type="text" className="border p-1 w-full focus:outline-accent" value={value} onChange={(e) => setValue(e.target.value)}/>;
            }
    };

    const toggleCollapse = (polygonId) => {
        setCollapsedStates(prevState => ({
            ...prevState,
            [polygonId]: !prevState[polygonId]
        }));
    };

    return (
        <div className="h-fit w-full flex flex-col gap-3 justify-center items-center">

            {activePolygons.length === 0 && (
                <p className="text-center text-gray-500 h-full flex items-center min-h-[30vh] p-2">Select a polygon to view its parameters</p>
            )}

            {activePolygons.map((polygon, index) => (
                <div className="w-full bg-white text-black border border rounded-lg overflow-hidden" key={index}>
                    <div className="border-b flex items-center justify-between p-2 gap-2">
                        <h1 className="text-l font-semibold">Parameters ({polygon.name})</h1>

                        <button
                            className="p-2 flex justify-center items-center bg-secondary hover:bg-accent rounded-lg"
                            onClick={() => toggleCollapse(polygon.id)}
                        >
                            <FontAwesomeIcon
                                icon={!collapsedStates[polygon.id]?(faCaretDown):(faCaretUp)}
                                className="text-l text-contrast"
                            />
                        </button>
                    </div>

                    {collapsedStates[polygon.id] && (
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

                            <table className="w-full border-collapse">
                                <tbody>
                                    {searchResults.map((parameter, index) => (
                                        <tr key={index}>
                                            <td className="p-2">{parameter.name}</td>
                                            <td className="p-2"><CustomInput parameter={parameter} /></td>
                                            <td className="p-2 text-xs">{parameter.unit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}

export default LoadParameterList;