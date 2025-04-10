import React from "react";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, BarChart, Bar } from "recharts";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand, faMinimize, faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';

import { usePolygons } from "../contexts/polygonContext";

function LoadGraphs() {

    const [dataMap, setDataMap] = useState({});
    const [graphsLoading, setGraphsLoading] = useState(true);
    const [collapsedStates, setCollapsedStates] = useState({});

    const [fullScreenGraph, setFullScreenGraph] = useState('');
    const [fullScreenGraphVisible, setFullScreenGraphVisible] = useState(false);

    const toggleFullScreenGraph = (graph_type) => {
        return
        setFullScreenGraphVisible(!fullScreenGraphVisible);
        setFullScreenGraph(graph_type);
    };

    const toggleCollapse = (polygonId) => {
        setCollapsedStates(prevState => ({
            ...prevState,
            [polygonId]: !prevState[polygonId]
        }));
    };

    const { activePolygons } = usePolygons();
    
    useEffect(() => {
        const fetchPolygonData = async () => {
            setGraphsLoading(true);
            const newDataMap = {};
            
            try {
                for (const polygon of activePolygons) {
                    const response = await fetch(`/plots/${polygon.name}/data.json`);
                    const jsonData = await response.json();
                    newDataMap[polygon.name] = jsonData;
                }
                setDataMap(newDataMap);
            } catch (error) {
                console.error("Error fetching polygon data:", error);
            } finally {
                setGraphsLoading(false);
            }
        };

        if (activePolygons.length > 0) {
            fetchPolygonData();
        }
    }, [activePolygons]);

    // Add this function to get the custom Y-axis limit based on polygon name
    const getCustomYLimit = (polygonName) => {
        const limitsMap = {
            'Caltech': 2.7,
            'Maurath': 1.1,
            'Nana': 3.3,
            'Highschool': 2.25,
            'Ohiostate': 1.05,
            'Kentstate': 2.0,
            'Jackson': 1.2,
            'Duncan': 1.25,
            'Ardill': 8.0,
            'Alena': 4.7
        };
        
        return limitsMap[polygonName] || 6; // Default to 6 if polygon name not found
    };

    const formatXAxis = (value) => `${(value).toFixed(1)}K`;

    // Get consistent scale value across all polygon data
    const getGlobalScale = () => {
        let globalMaxValue = 0;
        
        for (const polygon of activePolygons) {
            const data = dataMap[polygon.name];
            if (data) {
                if (data.estimated_potential?.y) {
                    globalMaxValue = Math.max(globalMaxValue, Math.max(...data.estimated_potential.y));
                }
                if (data.net_potential?.y) {
                    globalMaxValue = Math.max(globalMaxValue, Math.max(...data.net_potential.y));
                }
            }
        }
        
        let scale = 1;
        while (globalMaxValue / scale > 10) {
            scale *= 10;
        }
        
        return scale;
    };

    const formatYAxisBillions = (value) => {
        if (value === 0) return '0';
        const scale = getGlobalScale();
        return `${(value / scale).toFixed(2)}`;
    };

    // Function to determine the Y-axis label with the correct exponent
    const getYAxisExponentLabel = () => {
        const scale = getGlobalScale();
        return `(1e${Math.log10(scale).toFixed(0)})`;
    };

    const formatTemperature = (value) => {
        return Math.round(value);
    };

    return (
        <div className="h-full w-full flex flex-col items-center rounded-lg gap-3 text-contrast">
            {activePolygons ? (
                graphsLoading ? (
                    <div className="h-[calc(100vh-100px)] flex items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto h-8 w-8 mb-4 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin"></div>
                            <p>Loading graph data...</p>
                        </div>
                    </div>
                ) : (
                    activePolygons.map((polygon, index) => {
                        const data = dataMap[polygon.name] || {};
                        return (
                            <div className="flex flex-col w-full bg-white rounded-lg border overflow-hidden" key={index}>
                                <div className="border-b flex items-center justify-between p-2 gap-2">
                                    <h1 className="text-l font-semibold">Graphs ({polygon.name})</h1>

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
                                    <div className="bg-white p-2 gap-2 flex flex-col h-[calc(100vh-8.5rem)]">
                                        
                                        {/* ------------------------ ESTIMATED POTENTIAL PLOT ------------------------ */}
                                        {data.estimated_potential && (
                                            <div className="flex-1 border border rounded-md flex flex-col justify-between gap-2 w-full bg-primary overflow-hidden pt-2">

                                            
                                                {/* LEGEND */}
                                                <div className='rounded text-black flex justify-center gap-4'>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                                                        <div style={{ aspectRatio:'1/1', height: '10px', background: 'blue' }}></div>
                                                        <span style={{ fontSize: '10px' }}>Alteration</span>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <div style={{ aspectRatio:'1/1', height: '10px', background: 'red', border: '1px dashed black' }}></div>
                                                        <span style={{ fontSize: '10px' }}>Radiolysis</span>
                                                    </div>
                                                </div>

                                                {/* MAIN GRAPH */}
                                                <ResponsiveContainer className={'h-full w-full'}>
                                                    <LineChart 
                                                        data={data?.estimated_potential?.x.map((x, i) => ({ x, y: data?.estimated_potential?.y[i] }))}
                                                        margin={{ top: 5, right: 20, left: 0, bottom: 15 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        {(() => {
                                                            const temperatures = data.estimated_potential.x;
                                                            
                                                            const minTemp = Math.min(...temperatures);
                                                            const maxTemp = Math.max(...temperatures);
                                                            
                                                            const step = 100;
                                                            
                                                            const startTick = Math.floor(minTemp / step) * step;
                                                            const endTick = Math.ceil(maxTemp / step) * step;
                                                            
                                                            const ticks = [];
                                                            for (let i = startTick; i <= endTick; i += step) {
                                                                ticks.push(i);
                                                            }
                                                                                
                                                            return (
                                                                <XAxis 
                                                                    dataKey="x" 
                                                                    tickFormatter={formatTemperature}
                                                                    domain={['dataMin', 'dataMax']}
                                                                    ticks={ticks}
                                                                    label={{ 
                                                                        value: "Temperature (°C)", 
                                                                        position: "insideBottom", 
                                                                        offset: -7, 
                                                                        style: { textAnchor: 'middle' },
                                                                        fontSize: 12
                                                                    }}
                                                                    fontSize={10}
                                                                />
                                                            );
                                                        })()}
                                                        <YAxis 
                                                            tickFormatter={formatYAxisBillions}
                                                            domain={[0, getCustomYLimit(polygon.name) * getGlobalScale()]}
                                                            fontSize={10}
                                                            tickCount={6}
                                                            label={{ 
                                                                value: `Generation ${getYAxisExponentLabel()}`, 
                                                                angle: -90, 
                                                                position: "insideLeft", 
                                                                style: { textAnchor: 'middle' },
                                                                offset: 15,
                                                                fontSize: 12
                                                            }}
                                                        />
                                                        // Update the tooltip formatter
                                                        <Tooltip 
                                                            formatter={(value) => [`${(value / getGlobalScale()).toFixed(2)}`, 'Generation']}
                                                            labelFormatter={(label) => `Temperature: ${label}°C`}
                                                        />
                                                        <Line type="monotone" dataKey="y" stroke="blue" name="Alteration" />
                                                        <ReferenceLine y={data.estimated_potential.radiolysis.R} stroke="red" strokeDasharray="3 3"/>
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* ------------------------ NET POTENTIAL PLOT ------------------------ */}
                                        {data.net_potential && (
                                            <div className="flex-1 border border rounded-md flex flex-col justify-between gap-2 w-full bg-primary  overflow-hidden pt-2">


                                                {/* LEGEND */}
                                                <div className='rounded text-black flex justify-center gap-4'>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                                                        <div style={{ aspectRatio:'1/1', height: '10px', background: 'green' }}></div>
                                                        <span style={{ fontSize: '10px' }}>Alteration</span>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <div style={{ aspectRatio:'1/1', height: '10px', background: 'red', border: '1px dashed black' }}></div>
                                                        <span style={{ fontSize: '10px' }}>Radiolysis</span>
                                                    </div>
                                                </div>

                                                {/* MAIN GRAPH */}
                                                <ResponsiveContainer className={'h-full w-full'}>
                                                    <LineChart 
                                                        data={data?.net_potential?.x.map((x, i) => ({ x, y: data?.net_potential?.y[i] }))}
                                                        margin={{ top: 5, right: 20, left: 0, bottom: 15 }}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        {(() => {
                                                        const temperatures = data.net_potential.x;
                                                        
                                                        const minTemp = Math.min(...temperatures);
                                                        const maxTemp = Math.max(...temperatures);
                                                                                    
                                                        const step = 100;
                                                        
                                                        const startTick = Math.floor(minTemp / step) * step;
                                                        const endTick = Math.ceil(maxTemp / step) * step;
                                                        
                                                        const ticks = [];
                                                        for (let i = startTick; i <= endTick; i += step) {
                                                            ticks.push(i);
                                                        }
                                                                                    
                                                        return (
                                                            <XAxis 
                                                                dataKey="x" 
                                                                tickFormatter={formatTemperature}
                                                                domain={['dataMin', 'dataMax']}
                                                                ticks={ticks}
                                                                label={{ 
                                                                    value: "Temperature (°C)", 
                                                                    position: "insideBottom", 
                                                                    offset: -7, 
                                                                    style: { textAnchor: 'middle' },
                                                                    fontSize: 12
                                                                }}
                                                                fontSize={10}
                                                                />
                                                            );
                                                        })()}
                                                        <YAxis 
                                                            tickFormatter={formatYAxisBillions}
                                                            domain={[0, getCustomYLimit(polygon.name) * getGlobalScale()]}
                                                            tickCount={6}
                                                            label={{ 
                                                                value: `Potential ${getYAxisExponentLabel()}`, 
                                                                angle: -90, 
                                                                position: "insideLeft", 
                                                                style: { textAnchor: 'middle' },
                                                                offset: 15,
                                                                fontSize: 12
                                                            }}
                                                            fontSize={10}
                                                        />
                                                        // Update the tooltip formatter
                                                        <Tooltip 
                                                            formatter={(value) => [`${(value / getGlobalScale()).toFixed(2)}`, 'Potential']}
                                                            labelFormatter={(label) => `Temperature: ${label}°C`}
                                                        />
                                                        <Line type="monotone" dataKey="y" stroke="green" name="Alteration" />
                                                        <ReferenceLine y={data.net_potential.radiolysis.R} stroke="red" strokeDasharray="3 3"/>
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                
                                        {/* ------------------------ MONTE CARLO HISTOGRAM ------------------------ */}
                                        {data.monte_carlo && (
                                            <div className="flex-1 border border rounded-md flex flex-col justify-between gap-2 w-full bg-primary overflow-hidden pt-2">
                                            

                                                
                                                {/* MAIN GRAPH */}
                                                <ResponsiveContainer>
                                                <BarChart 
                                                    data={data?.monte_carlo?.bins?.map((bin, i) => ({ bin, n: data?.monte_carlo?.n[i] }))}
                                                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis 
                                                    dataKey="bin"
                                                    tickFormatter={formatXAxis}
                                                    type='number'
                                                    label={{ 
                                                        value: "Generation", 
                                                        position: "insideBottom", 
                                                        offset: -7,
                                                        style: { textAnchor: 'middle' },
                                                        fontSize: 12
                                                    }}
                                                    fontSize={10}
                                                    />
                                                    
                                                    <YAxis 
                                                    label={{ 
                                                        value: "Occurences", 
                                                        angle: -90, 
                                                        position: "insideLeft", 
                                                        style: { textAnchor: 'middle' },
                                                        offset: 15,
                                                        fontSize: 12
                                                    }}
                                                    fontSize={10}
                                                    />
                                                
                                                    <Tooltip formatter={(value) => [`${value}`, "Occurences"]} />

                                                    <ReferenceLine x={data.monte_carlo.p10} stroke="red" strokeDasharray="4 4" label={{ position: 'top', value: 'P10', offset: 1, fill: 'red', fontSize: 10, dx:-5 }} />
                                                    <ReferenceLine x={data.monte_carlo.p50} stroke="green" strokeDasharray="4 4" label={{ position: 'top', value: 'P50', offset: 1, fill: 'green', fontSize: 10, dx:0 }} />
                                                    <ReferenceLine x={data.monte_carlo.p90} stroke="blue" strokeDasharray="4 4" label={{ position: 'top', value: 'P90', offset: 1, fill: 'blue', fontSize: 10, dx:5 }} />
                                                    <Bar 
                                                    dataKey="n" 
                                                    fill="blue"
                                                    shape={(props) => {
                                                    const { x, y, width, height } = props;

                                                    const fillColor = (props.bin < data.monte_carlo.p10 || props.bin > data.monte_carlo.p90) ? "pink" : "blue";
                                                    return <rect x={x} y={y} width={width} height={height} fill={fillColor} />;
                                                    }}
                                                />
                                                </BarChart>
                                                </ResponsiveContainer>

                                                <div className='text-xs flex justify-between text-[0.5rem] px-2'>
                                                    <p>P10 : {data.monte_carlo.p10.toFixed(2)}</p>
                                                    <p>P50 : {data.monte_carlo.p50.toFixed(2)}</p>
                                                    <p>P90 : {data.monte_carlo.p90.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                    </div>
                                )}
                            </div>
                        );
                    })
                )
                ) : (
                    <p className="text-center text-gray-500 h-full flex items-center p-2">Select a polygon to view its graphs</p>
                )
            }

        </div>
    );
}

export default LoadGraphs;