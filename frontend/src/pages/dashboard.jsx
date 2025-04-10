import React, { useState, useEffect } from "react";

import LoadPolygonList from "../components/polygonList";
import LoadParameterList from "../components/parameterList";

import LoadAttributeTable from "../components/attributeTable";
import LoadMap from "../components/map";

import LoadGraphs from "../components/graphs";

import Tooltip from "../components/tooltip";

import { PolygonContextProvider } from "../contexts/polygonContext";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

function LoadDashboard() {

    const [filters, setFilters] = useState(['My saved filter', 'Another filter', 'Filter 3', 'Filter 4', 'Filter 5']);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        if (searchTerm === '') {
            setSearchResults([]);
            return;
        }
        const result = filters.filter(filter => 
            filter.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(result);
    }, [searchTerm, filters]);

    return (
        <PolygonContextProvider>
            <div className="flex bg-primary text-white relative z-0">

                <div className="w-[20vw] flex flex-col pt-2 pl-2 pb-2 pr-1.5 gap-3 relative">
                    <LoadPolygonList />
                    <LoadParameterList />
            
                    <div className="bg-primary flex justify-between gap-2 py-4 sticky bottom-0 w-full text-sm">
                        <Tooltip text="Reset all selections and parameters to their default values">
                            <button className="p-2 bg-accent rounded-md flex-1 text-contrast">Reset</button>
                        </Tooltip>
                        <Tooltip text="Save current selections and parameters as a filter preset">
                            <button className="p-2 bg-accent rounded-md flex-1 text-contrast">Save</button>
                        </Tooltip>
                        <Tooltip text="Run calculations with current parameters and selections">
                            <button className="p-2 bg-accent rounded-md flex-1 text-contrast">Calculate</button>
                        </Tooltip>
                    </div>
                </div>

                <div className="flex flex-col w-[60vw] px-1.5 py-2 gap-3">
                    <div className="sticky top-[4.5rem] z-[99999]">
                        <div className={`flex items-center border gap-2 bg-white px-[1rem] py-[0.75rem] h-full ${searchResults.length !== 0 ? 'rounded-tl-lg' : 'rounded-lg'}`}>
                            <input type="text" 
                                placeholder="Search for a saved filter..." 
                                className="bg-white text-contrast w-full focus:outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <FontAwesomeIcon icon={faSearch} className="text-xl text-gray-400" />
                        </div>
    
                        {(searchResults.length !== 0) && (
                            <div id="search-results" className="absolute bg-primary w-[100%] rounded-br-lg rounded-bl-lg text-left z-[99999] text-contrast border overflow-hidden">
                                {searchResults.map((filter, index) => (
                                    <p className="p-2 border-b hover:cursor-pointer hover:bg-white">{filter}</p>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <LoadMap />
                    <LoadAttributeTable />
                </div>

                <div className="w-[20vw] flex flex-col pt-2 pl-1.5 pb-2 pr-2 gap-3">
                    <LoadGraphs />
                </div>

            </div>
        </PolygonContextProvider>
    );
}

export default LoadDashboard;