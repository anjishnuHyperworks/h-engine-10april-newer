import React from "react";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdd, faSearch, faTrash, faClose, faEdit, faCancel, faCaretDown, faCircleInfo, faCaretUp, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { faSquareCheck } from "@fortawesome/free-regular-svg-icons";

import CustomChipText from '../components/chip'
import LoadLoader from "../components/loading";
import CustomParameterInput from "../components/customParameterInput";

import { useSignIn } from '../contexts/signInContext';
import { useMessage } from "../contexts/messageContext"; 

import { get_all_polygons, add_polygon, delete_selected_polygons, update_polygon } from '../connectors/polygons';
import { get_all_parameters, get_parameters_for_polygon } from '../connectors/parameters';

import Papa from "papaparse";
import CustomFileUpload from "../components/fileUpload";

import Tooltip from "../components/tooltip";

function LoadManagePolygons() {

    const { showMessage } = useMessage();
    const { signedIn, signedInUser, encryptionKey } = useSignIn();

    const [polygons, setPolygons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [parameters, setParameters] = useState([]);
    const [importedPolygons, setImportedPolygons] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const searchColumns = ["POLYGON_NAME", "POLYGON_MAPPER_ID", "STATUS"];
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    
    const [showAddPolygonModal, setShowAddPolygonModal] = useState(false);
    const [showPolygonProfileModal, setShowPolygonProfileModal] = useState(false);
    const [showImportFromCSVModal, setShowImportFromCSVModal] = useState(false);
    const [showEditPolygonModal, setShowEditPolygonModal] = useState(false);
    const [showDeletePolygonModal, setShowDeletePolygonModal] = useState(false);
    const [showDeleteSelectedPolygonsModal, setShowDeleteSelectedPolygonsModal] = useState(false);
    
    const [selectedPolygon, setSelectedPolygon] = useState(null);
    const [parametersOfSelectedPolygon, setParametersOfSelectedPolygon] = useState([]);
    const [editingPolygon, setEditingPolygon] = useState(selectedPolygon);
    const [polygonsSelectedForDelete, setPolygonsSelectedForDelete] = useState([]);
    const [showSelectColumn, setShowSelectColumn] = useState(false);
    
    const [newPolygon, setNewPolygon] = useState({
        POLYGON_NAME: "",
        POLYGON_MAPPER_ID: "",
        POLYGON_PARAMETERS: parameters.map((param) => ({
            ...param,
            DEFAULT_VALUE: "",
        })),
        STATUS: "active",
    });

    const loadPolygons = () => {
        setLoading(true);
        get_all_polygons(signedInUser.USER_ID, encryptionKey)
            .then(data => {
                setPolygons(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching polygons:", error);
                setLoading(false);
            });
    };

    const loadParameters = () => {
        setLoading(true);
        get_all_parameters(signedInUser.USER_ID, encryptionKey)
            .then(data => {
                setParameters(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching parameters:", error);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadPolygons()
        loadParameters()
    }, [encryptionKey]);

    useEffect(() => {
        setNewPolygon({
            POLYGON_NAME: "",
            POLYGON_MAPPER_ID: "",
            POLYGON_PARAMETERS: parameters.map((param) => ({
                ...param,
                DEFAULT_VALUE: "",
            })),
            STATUS: "active",
        });
    }, [parameters]);

    useEffect(() => {
        setEditingPolygon(selectedPolygon);
        if (selectedPolygon) {
            get_parameters_for_polygon(signedInUser.USER_ID, encryptionKey, selectedPolygon.POLYGON_ID)
                .then(data => {
                    setParametersOfSelectedPolygon(data);
                }
                )
                .catch(error => {
                    console.error("Error fetching polygon parameters:", error);
                }
                );
        }
    }, [selectedPolygon]);

    const handlePolygonSelectForDelete = (e, polygon) => {
        if (e.target.checked) {
            setPolygonsSelectedForDelete(prev => [...prev, polygon]);
        } else {
            setPolygonsSelectedForDelete(prev => prev.filter(u => u.POLYGON_ID !== polygon.POLYGON_ID));
        }
    };    

    const handleSelectColumnClick = () => {
        setShowSelectColumn(!showSelectColumn);
        setPolygonsSelectedForDelete([]);
    }

    // UPDATE AN EXISTING POLYGON
    const handlePolygonEditSave = () => {
        setLoading(true);
    
        if (!editingPolygon.POLYGON_NAME || !editingPolygon.POLYGON_MAPPER_ID) {
            showMessage("Polygon name and mapper ID are required.", "error");
            setLoading(false);
            return;
        }
    
        update_polygon(
            signedInUser.USER_ID,
            encryptionKey,
            editingPolygon.POLYGON_ID,
            editingPolygon.POLYGON_NAME,
            editingPolygon.POLYGON_MAPPER_ID,
            parametersOfSelectedPolygon.map((param) => ({
                PARAMETER_ID: param.PARAMETER_ID,
                DEFAULT_VALUE: param.DEFAULT_VALUE,
            })),
            signedInUser.USER_ID
        )
        .then(data => {
            if (data?.error) {
                showMessage(data.error, "error"); // Show backend error message
            } else {
                showMessage("Polygon updated successfully", "success");
                loadPolygons();
                setShowEditPolygonModal(false);
                setEditingPolygon(null);
                setSelectedPolygon(null);
            }
        })
        .catch(error => {
            const errorMessage = error.response?.data?.error || error.message || "An unknown error occurred.";
            showMessage(errorMessage, "error");
        })
        .finally(() => {
            setLoading(false);
        });
    };
    
    // ADD A NEW POLYGON
    const handlePolygonAddition = () => {
        if (!newPolygon.POLYGON_NAME || !newPolygon.POLYGON_MAPPER_ID) {
            showMessage("Polygon name and mapper ID are required.", "error");
            return;
        }
    
        setLoading(true);
    
        add_polygon(
            signedInUser.USER_ID,
            encryptionKey,
            newPolygon.POLYGON_NAME, 
            newPolygon.POLYGON_MAPPER_ID, 
            newPolygon.POLYGON_PARAMETERS, 
            signedInUser.USER_ID
        )
        .then(data => {
            if (data?.error) {
                showMessage(data.error, "error"); // Show backend error message
            } else {
                showMessage("Polygon added successfully", "success");
                loadPolygons();
                setShowAddPolygonModal(false);
                setNewPolygon({
                    POLYGON_NAME: "",
                    POLYGON_MAPPER_ID: "",
                    POLYGON_PARAMETERS: parameters.map((param) => ({
                        ...param,
                        DEFAULT_VALUE: "",
                    })),
                    STATUS: "active",
                });
            }
        })
        .catch(error => {
            const errorMessage = error.response?.data?.error || error.message || "An unknown error occurred.";
            showMessage(errorMessage, "error");
        })
        .finally(() => {
            setLoading(false);
        });
    };
    
    // DELETE A LIST OF SELECTED POLYGONS
    const handlePolygonListDeletion = () => {
        const selectedPolygonIdsForDeletion = polygonsSelectedForDelete.map(polygon => polygon.POLYGON_ID);
        setLoading(true);
    
        delete_selected_polygons(signedInUser.USER_ID, encryptionKey, selectedPolygonIdsForDeletion)
            .then(data => {
                if (data?.error) {
                    showMessage(data.error, "error"); // Show backend error message
                } else {
                    showMessage(`${polygonsSelectedForDelete.length} Polygons deleted successfully`, "success");
                    loadPolygons();
                    setPolygonsSelectedForDelete([]);
                    setShowDeleteSelectedPolygonsModal(false);
                }
            })
            .catch(error => {
                const errorMessage = error.response?.data?.error || error.message || "An unknown error occurred.";
                showMessage(errorMessage, "error");
            })
            .finally(() => {
                setLoading(false);
            });
    };
    
    // DELETE A SINGLE POLYGON
    const handleSinglePolygonDeletion = () => {
        setLoading(true);
    
        delete_selected_polygons(signedInUser.USER_ID, encryptionKey, [selectedPolygon.POLYGON_ID])
            .then(data => {
                if (data?.error) {
                    showMessage(data.error, "error"); // Show backend error message
                } else {
                    showMessage("Polygon deleted successfully", "success");
                    loadPolygons();
                    setShowDeletePolygonModal(false);
                }
            })
            .catch(error => {
                const errorMessage = error.response?.data?.error || error.message || "An unknown error occurred.";
                showMessage(errorMessage, "error");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleCancelAddPolygon = () => {
        setNewPolygon({
            POLYGON_NAME: "",
            POLYGON_MAPPER_ID: "",
            POLYGON_PARAMETERS: parameters.map((param) => ({
                ...param,
                DEFAULT_VALUE: "", 
            })),
            STATUS: "active",
        });
        setShowAddPolygonModal(false);
    };

    const handleCancelEditPolygon = () => {
        setShowEditPolygonModal(false);
    };

    const handleImportCsvForPolygons = (file) => {
        if (!file) {
            showMessage("No file selected.", "error");
            return;
        }
    
        Papa.parse(file, {
            complete: (result) => {
                const { data } = result;
    
                if (!data || !Array.isArray(data) || data.length < 2) {
                    showMessage("CSV file is empty or invalid.", "error");
                    return;
                }
    
                if (!Array.isArray(data[0])) {
                    showMessage("Invalid CSV format. Headers not found.", "error");
                    return;
                }
    
                const headers = data[0].map((h) => h.trim());
    
                const headerCounts = headers.reduce((acc, header) => {
                    acc[header] = (acc[header] || 0) + 1;
                    return acc;
                }, {});
    
                const duplicateHeaders = Object.entries(headerCounts)
                    .filter(([_, count]) => count > 1)
                    .map(([header, count]) => `${header} appeared ${count} times`);
    
                if (duplicateHeaders.length > 0) {
                    showMessage(
                        `Duplicate column names found: ${duplicateHeaders.join(", ")}. Each column must be unique.`,
                        "error"
                    );
                    return;
                }
    
                const requiredHeaders = ["POLYGON_NAME", "POLYGON_MAPPER_ID"];
                if (!requiredHeaders.every((header) => headers.includes(header))) {
                    showMessage(
                        "The CSV file uploaded is missing required columns (POLYGON_NAME, POLYGON_MAPPER_ID).",
                        "error"
                    );
                    return;
                }
    
                const colIndex = {
                    name: headers.indexOf("POLYGON_NAME"),
                    mapperId: headers.indexOf("POLYGON_MAPPER_ID"),
                };
    
                const parameterNames = headers.slice(2);
    
                const parsedData = data
                    .slice(1)
                    .filter((row) => Array.isArray(row) && row.length >= headers.length)
                    .map((row) => ({
                        POLYGON_NAME: row[colIndex.name]?.trim() || "",
                        POLYGON_MAPPER_ID: row[colIndex.mapperId]?.trim() || "",
                        POLYGON_PARAMETERS: parameterNames.map((param, i) => ({
                            PARAMETER_ID: parameters.find((p) => p.PARAMETER_NAME === param)?.PARAMETER_ID || null,
                            DEFAULT_VALUE: row[i + 2]?.trim() || "",
                        })),
                    }))
                    .filter((row) => row.POLYGON_NAME);
    
                setImportedPolygons(parsedData);
            },
            skipEmptyLines: true,
        });
    };    
    
    const cancelImportFromCSV = () => {
        setImportedPolygons([]);
        setShowImportFromCSVModal(false);
    }

    const uploadCsvImportedPolygons = (parsedData) => {
        setLoading(true);
    
        const promises = parsedData.map((polygon) => {
            return add_polygon(
                polygon.POLYGON_NAME,
                polygon.POLYGON_MAPPER_ID,
                polygon.POLYGON_PARAMETERS,
                signedInUser.USER_ID
            );
        });
    
        Promise.all(promises)
            .then((responses) => {
                if (responses.every((res) => res.ok)) {
                    showMessage(`All ${parsedData.length} polygons imported successfully.`, "success");
                } else {
                    showMessage("Some polygons failed to import. Please try again.", "error");
                }
                loadPolygons();
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error adding polygons:", error);
                showMessage("Error adding polygons. Please try again.", "error");
            })
            .finally(() => {
                setLoading(false);
                setImportedPolygons([]);
                setShowImportFromCSVModal(false);
            });
    };

    const downloadTemplate = () => {
        const headers = ["POLYGON_NAME", "POLYGON_MAPPER_ID"];
    
        const parameterColumns = parameters.map(param => param.PARAMETER_NAME);
        const allHeaders = [...headers, ...parameterColumns];
    
        const csvContent = [allHeaders.join(",")].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
    
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "polygons_template.csv");
        document.body.appendChild(link);
        link.click();
    
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handlePolygonRowClick = (e, polygon) => {
        setSelectedPolygon(polygon);
    }

    const handleSort = (columnKey) => {
        setSortConfig((prev) => ({
            key: columnKey,
            direction: prev.key === columnKey && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const sortedPolygons = [...polygons].sort((a, b) => {
        if (!sortConfig.key) return 0;
    
        let valueA = a[sortConfig.key] ?? ""; 
        let valueB = b[sortConfig.key] ?? "";
    
        if (sortConfig.key === "CREATED_AT") {
            valueA = valueA ? new Date(valueA) : new Date(0); 
            valueB = valueB ? new Date(valueB) : new Date(0);
        } else if (typeof valueA === "string" && typeof valueB === "string") {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
    
        if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });

    const filteredPolygons = sortedPolygons.filter(polygon => 
        searchColumns.some(column => 
            polygon[column] && polygon[column].toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        
        <div className="relative flex flex-col items-center justify-center w-full p-4">
            
            {loading && <LoadLoader />}

            { polygons.length === 0 && !loading ? (
                <div className="flex flex-col bg-hover_contrast rounded-lg items-center justify-center w-full h-[calc(100vh-6rem)] gap-[2rem]">
                    <p className="text-lg text-center ">No polygons found</p>
                
                    <div className="flex gap-4">
                        <Tooltip text="Add a new polygon">
                            <button className="flex-1 bg-contrast text-primary px-6 py-4 rounded-lg flex justify-center items-center gap-2 whitespace-nowrap text-nowrap" 
                                onClick={() => setShowAddPolygonModal(true)}>
                                <FontAwesomeIcon icon={faAdd} className="text-primary" />
                                <p>ADD A POLYGON</p>
                            </button>
                        </Tooltip>
                        
                        {/* <Tooltip text="Import polygons from CSV">
                            <button className="flex-1 bg-contrast text-primary px-6 py-4 rounded-lg flex justify-center items-center gap-2 whitespace-nowrap text-nowrap"
                                onClick={() => setShowImportFromCSVModal(true)}>
                                <FontAwesomeIcon icon={faFileImport} className="text-primary" />
                                <p>IMPORT FROM A CSV</p>
                            </button>
                        </Tooltip> */}
                    </div>
                </div>
            ) : (
                <>
                    <h1 className="w-full items-start py-[1rem] text-[2rem] font-bold ">Polygon Management</h1>

                    <div className="flex justify-between w-full gap-2 sticky top-[4rem] bg-primary py-4">
                        <div className="flex items-center relative w-full">
                            <input type="text"
                                placeholder="Search..."
                                className="w-full bg-white border px-4 py-2 text-sm text-contrast focus:outline-none rounded-lg"
                                onChange={(e) => setSearchTerm(e.target.value)}
                                value={searchTerm}
                            />
                            <FontAwesomeIcon icon={faSearch} className="absolute text-l text-contrast right-4" />
                        </div>

                        <div className="flex gap-2 items-center">
                            {selectedPolygon === null && polygonsSelectedForDelete.length === 0 && (
                                <Tooltip text="Add a new polygon">
                                    <button className="flex items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={() => setShowAddPolygonModal(true)}>
                                        <FontAwesomeIcon icon={faAdd} />
                                        <p>Add</p>
                                    </button>
                                </Tooltip>
                            )}

                            {selectedPolygon !== null && (
                                <Tooltip text="Show the selected polygon profile">
                                    <button className="flex items-center text-nowrap justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={(e) => setShowPolygonProfileModal(true)}>
                                        <FontAwesomeIcon icon={faCircleInfo} />
                                        <p>Show More</p>
                                    </button>
                                </Tooltip>
                            )}

                            {selectedPolygon !== null && (
                                <Tooltip text="Edit the selected polygon">
                                    <button className="flex items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={(e) => setShowEditPolygonModal(true)}>
                                        <FontAwesomeIcon icon={faEdit} />
                                        <p>Edit</p>
                                    </button>
                                </Tooltip>
                            )}

                            {polygonsSelectedForDelete.length === 0 && selectedPolygon && polygons.length > 1 && (
                                <Tooltip text="Delete the selected polygon">
                                    <button className="flex items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={(e) => setShowDeletePolygonModal(true)}>
                                        <FontAwesomeIcon icon={faTrash} />
                                        <p>Delete</p>
                                    </button>
                                </Tooltip>
                            )}

                            {polygonsSelectedForDelete.length === 0 && selectedPolygon && polygons.length > 1 && (
                                <Tooltip text="Deselect the selection">
                                    <button className="flex items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={(e) => setSelectedPolygon(null)}>
                                        <FontAwesomeIcon icon={faCancel} />
                                        <p>Cancel</p>
                                    </button>
                                </Tooltip>
                            )}

                            {/* {polygonsSelectedForDelete.length > 0 && (
                                <Tooltip text="Delete the selected polygons">
                                    <button className="flex flex-1 text-nowrap items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={() => setShowDeleteSelectedPolygonsModal(true)}>
                                        <FontAwesomeIcon icon={faTrash} />
                                        <p>Delete Selected</p>
                                    </button>
                                </Tooltip>
                            )} */}
                            
                            {/* {selectedPolygon === null && (
                                <Tooltip text={!showSelectColumn ? "Enable selection mode to delete multiple polygons" : "Disable selection mode"}>
                                    <button className="flex items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={handleSelectColumnClick}>
                                        <FontAwesomeIcon icon={!showSelectColumn ? faSquareCheck : faCancel}/>
                                        <p>{!showSelectColumn ? 'Select' : 'Cancel'}</p>
                                    </button>
                                </Tooltip>
                            )} */}
                        </div>
                    </div>

                    <table className="min-w-full border-separate border-spacing-0 border text-contrast rounded-lg">
                        <thead>
                            <tr className="bg-contrast text-left text-primary">
                                {showSelectColumn && (
                                    <th className="p-2 rounded-tl-md">Selected</th>
                                )}
                                <th className={`p-2 font-semibold ${!showSelectColumn ? "rounded-tl-md" : ""}`}>No.</th>
                                <th className={`p-2 cursor-pointer`} onClick={() => handleSort("POLYGON_NAME")}>
                                    Polygon Name {sortConfig.key === "POLYGON_NAME" ? (sortConfig.direction === "asc" ? <FontAwesomeIcon className="ml-2" icon={faCaretUp} /> : <FontAwesomeIcon className="ml-2" icon={faCaretDown} />) : ""}
                                </th>
                                <th className="p-2 cursor-pointer" onClick={() => handleSort("POLYGON_MAPPER_ID")}>
                                    Polygon Mapper ID {sortConfig.key === "POLYGON_MAPPER_ID" ? (sortConfig.direction === "asc" ? <FontAwesomeIcon className="ml-2" icon={faCaretUp} /> : <FontAwesomeIcon className="ml-2" icon={faCaretDown} />) : ""}
                                </th>
                                <th className={`p-2 cursor-pointer`} onClick={() => handleSort("CREATED_AT")}>
                                    Created at {sortConfig.key === "CREATED_AT" ? (sortConfig.direction === "asc" ? <FontAwesomeIcon className="ml-2" icon={faCaretUp} /> : <FontAwesomeIcon className="ml-2" icon={faCaretDown} />) : ""}
                                </th>
                                <th className="p-2 rounded-tr-md">Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredPolygons.map((polygon, rowIndex) => (
                                <tr key={polygon.POLYGON_ID} className={`border text-nowrap hover:bg-black hover:bg-opacity-5 ${selectedPolygon?.POLYGON_ID === polygon.POLYGON_ID ? 'bg-secondary' : ''}`}  onClick={(e) => handlePolygonRowClick(e, polygon)}>
                                    {showSelectColumn && (
                                        <td className="p-2 border-b">
                                            <input 
                                            type="checkbox" 
                                            className="w-[1rem] h-[1rem] accent-contrast rounded-lg"
                                            checked={polygonsSelectedForDelete.some(u => u.POLYGON_ID === polygon.POLYGON_ID)}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handlePolygonSelectForDelete(e, polygon)}  />
                                        </td>
                                    )}

                                    <td className={`p-2 border-b ${!showSelectColumn ? "rounded-tl-md" : ""}`}>{rowIndex + 1}</td>
                                    <td className={`p-2 border-b ${rowIndex === polygons.length - 1 ? "rounded-bl-md" : ""}`}>{polygon.POLYGON_NAME || 'NULL'}</td>
                                    <td className="p-2 border-b">{polygon.POLYGON_MAPPER_ID}</td>
                                    <td className="p-2 border-b">{new Date(polygon.CREATED_AT).toLocaleString()}</td>
                                    <td className={`p-2 border-b ${rowIndex === polygons.length - 1 ? "rounded-br-md" : ""}`}>
                                        <CustomChipText 
                                            text={polygon.STATUS.toLowerCase()} 
                                            type={polygon.STATUS.toLowerCase() === 'active' ? 'success' : polygon.STATUS.toLowerCase() === 'inactive' ? 'error' : 'warning'} 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table> 

                    {/* EDIT POLYGON MODAL */}
                    {showEditPolygonModal && (
                        <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                        <div className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h1 className="font-bold  text-xl">EDIT POLYGON | <span className="font-semibold text-accent">{editingPolygon.POLYGON_NAME}</span></h1>                                
                                <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={handleCancelEditPolygon}><FontAwesomeIcon icon={faClose} /></button>
                            </div>

                            <div className="overflow-auto bg-primary flex-1 flex flex-col">
                                <div className="flex flex-col p-4 gap-2">
                                    <label className="font-semibold ">Polygon Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Polygon A" 
                                        className="p-2 border rounded-lg"
                                        value={editingPolygon.POLYGON_NAME}
                                        required
                                        onChange={(e) => setEditingPolygon({ ...editingPolygon, POLYGON_NAME: e.target.value })}
                                    />
                                </div>

                                <div className="flex flex-col p-4 gap-2">
                                    <label className="font-semibold ">Polygon Mapper ID</label>
                                    <input 
                                        type="text" 
                                        placeholder="1" 
                                        className="p-2 border rounded-lg"
                                        value={editingPolygon.POLYGON_MAPPER_ID}
                                        required
                                        onChange={(e) => setEditingPolygon({ ...editingPolygon, POLYGON_MAPPER_ID: e.target.value })}
                                    />
                                </div>

                                { parameters.length > 0 && (
                                    <div className="flex flex-col p-4 gap-2">
                                        <label className="font-semibold ">Parameters and default values</label>
                                        <table className="w-full border-collapse">
                                            <tbody>
                                                {parametersOfSelectedPolygon.map((parameter, index) => (
                                                    <tr key={index}>
                                                        <td className="p-2">{parameter.PARAMETER_NAME}</td>
                                                        <td className="p-2">
                                                        <CustomParameterInput 
                                                            editable
                                                            parameter={parameter} 
                                                            defaultValue={parameter.DEFAULT_VALUE}
                                                            onChange={(value) => {
                                                                setParametersOfSelectedPolygon((prev) =>
                                                                    prev.map((param) =>
                                                                        param.PARAMETER_ID === parameter.PARAMETER_ID
                                                                            ? { ...param, DEFAULT_VALUE: value }
                                                                            : param
                                                                    )
                                                                );
                                                            }}
                                                        />
                                                        </td>
                                                        <td className="p-2 text-xs">{parameter.PARAMETER_UNIT}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                                <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={handleCancelEditPolygon}>Cancel</button>
                                <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={handlePolygonEditSave}>Save</button>
                            </div>
                        </div>
                        </div>
                    )}

                    {/* DELETE POLYGON MODAL */}
                    {showDeletePolygonModal && selectedPolygon && (
                        <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                            <div className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                                <div className="flex justify-between items-center p-4 border-b">
                                    <h1 className="font-bold  text-xl">DELETE POLYGON | <span className="font-semibold text-accent">{selectedPolygon.POLYGON_NAME}</span></h1>
                                    <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowDeletePolygonModal(false)}>
                                        <FontAwesomeIcon icon={faClose} />
                                    </button>
                                </div>

                                <div className="overflow-auto bg-primary flex-1 flex flex-col">
                                    <div className="flex flex-col p-4 gap-2">
                                        <p>Are you sure you want to delete the polygon <span className="font-semibold text-accent">{selectedPolygon.POLYGON_NAME} ({selectedPolygon.POLYGON_MAPPER_ID})</span> ?</p>
                                    </div>
                                </div>

                                <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                                    <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={() => setShowDeletePolygonModal(false)}>Cancel</button>
                                    <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={handleSinglePolygonDeletion}>Delete</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DELETE SELECTED POLYGONS MODAL */}
                    {showDeleteSelectedPolygonsModal && (
                        <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                            <div className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                                <div className="flex justify-between items-center p-4 border-b">
                                    <h1 className="font-bold  text-xl">DELETE SELECTED POLYGONS</h1>
                                    <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowDeleteSelectedPolygonsModal(false)}>
                                        <FontAwesomeIcon icon={faClose} />
                                    </button>
                                </div>

                                <div className="overflow-auto bg-primary flex-1 flex flex-col">
                                    <div className="flex flex-col p-4 gap-2">
                                        <p>Are you sure you want to delete the selected polygons?</p>
                                    </div>

                                    <div className="flex flex-col p-4 gap-2">
                                        <table className="min-w-full border-separate border-spacing-0 border text-contrast rounded-lg">
                                            <thead>
                                                <tr className="bg-secondary text-left ">
                                                    <th className="p-2 rounded-tl-md">Polygon Name</th>
                                                    <th className="p-2 rounded-tr-md">Mapper ID</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {polygonsSelectedForDelete.map((polygon, rowIndex) => (
                                                    <tr key={polygon.POLYGON_ID} className="border text-nowrap">
                                                        <td className={`p-2 border-b ${rowIndex === polygonsSelectedForDelete.length - 1 ? "rounded-bl-md" : ""}`}>
                                                            {polygon.POLYGON_NAME}
                                                        </td>
                                                        <td className={`p-2 border-b ${rowIndex === polygonsSelectedForDelete.length - 1 ? "rounded-br-md" : ""}`}>
                                                            {polygon.POLYGON_MAPPER_ID}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                                    <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={() => setShowDeleteSelectedPolygonsModal(false)}>Cancel</button>
                                    <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={handlePolygonListDeletion}>Delete</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* POLYGON PROFILE MODAL */}
                    {showPolygonProfileModal && selectedPolygon && (
                        <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                            <form className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                                <div className="flex justify-between items-center p-4 border-b">
                                    <h1 className="font-bold text-xl">POLYGON PROFILE | <span className="font-semibold text-accent">{selectedPolygon.POLYGON_NAME}</span></h1>
                                    <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowPolygonProfileModal(false)}>
                                        <FontAwesomeIcon icon={faClose} />
                                    </button>
                                </div>

                                <div className="overflow-auto bg-primary flex-1 flex flex-col">
                                    <table className="w-full border-collapse text-left">
                                        <tbody>
                                            <tr className="border-b">
                                                <td className="p-4 font-semibold">Polygon Name</td>
                                                <td className="p-4"><input disabled readOnly value={selectedPolygon.POLYGON_NAME} className="p-2 border rounded-lg w-full" /></td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-4 font-semibold">Mapper ID</td>
                                                <td className="p-4"><input disabled readOnly value={selectedPolygon.POLYGON_MAPPER_ID} className="p-2 border rounded-lg w-full" /></td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-4 font-semibold">Status</td>
                                                <td className="p-4">
                                                    <CustomChipText 
                                                        text={selectedPolygon.STATUS.toLowerCase()} 
                                                        type={selectedPolygon.STATUS.toLowerCase() === 'active' ? 'success' : selectedPolygon.STATUS.toLowerCase() === 'inactive' ? 'error' : 'warning'} 
                                                    />
                                                </td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-4 font-semibold">Created By</td>
                                                <td className="p-4"><input disabled readOnly value={selectedPolygon.CREATED_BY} className="p-2 border rounded-lg w-full" /></td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-4 font-semibold">Created At</td>
                                                <td className="p-4"><input disabled readOnly value={selectedPolygon.CREATED_AT ? new Date(selectedPolygon.CREATED_AT).toLocaleString() : 'NULL'} className="p-2 border rounded-lg w-full" /></td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-4 font-semibold">Modified By</td>
                                                <td className="p-4"><input disabled readOnly value={selectedPolygon.MODIFIED_BY} className="p-2 border rounded-lg w-full" /></td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-4 font-semibold">Modified At</td>
                                                <td className="p-4"><input disabled readOnly value={selectedPolygon.MODIFIED_AT ? new Date(selectedPolygon.MODIFIED_AT).toLocaleString() : 'NULL'} className="p-2 border rounded-lg w-full" /></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    
                                    <div className="m-4 border rounded-md">
                                        <div className='border-b border-hover_contrast flex justify-between align-center p-4'>
                                            <h2 className="font-semibold my-auto">PARAMETERS</h2>
                                        </div>

                                        <table className="w-full border-collapse text-left">
                                            <tbody>
                                                {parametersOfSelectedPolygon.map((parameter, index) => (
                                                    <tr key={index} className="border-b">
                                                        <td className="p-4 font-semibold">{parameter.PARAMETER_NAME}</td>
                                                        <td className="p-4">
                                                            <input type="text" disabled value={parameter.DEFAULT_VALUE} className="w-full px-2 py-1 rounded-lg border"/>
                                                        </td>
                                                        <td className="p-4 text-xs">{parameter.PARAMETER_UNIT}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                                    <button type="button" className="py-2 px-4 bg-error_bg border rounded-lg" onClick={() => setShowPolygonProfileModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}
                </>
            )}

            {/* ADD NEW POLYGON MODAL */}
            {showAddPolygonModal && (
                <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                    <div className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h1 className="font-bold  text-xl">ADD NEW POLYGON</h1>
                            <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={handleCancelAddPolygon}><FontAwesomeIcon icon={faClose} /></button>
                        </div>

                        <div className="overflow-auto bg-primary flex-1 flex flex-col">
                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">Polygon Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Polygon A" 
                                    className="p-2 border rounded-lg"
                                    value={newPolygon.POLYGON_NAME}
                                    onChange={(e) => setNewPolygon({ ...newPolygon, POLYGON_NAME: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">Polygon Mapper ID</label>
                                <input 
                                    type="text" 
                                    placeholder="1" 
                                    className="p-2 border rounded-lg"
                                    value={newPolygon.POLYGON_MAPPER_ID}
                                    onChange={(e) => setNewPolygon({ ...newPolygon, POLYGON_MAPPER_ID: e.target.value })}
                                />
                            </div>

                            { parameters.length > 0 && (
                                <div className="flex flex-col p-4 gap-2">
                                    <label className="font-semibold ">Parameters and default values</label>
                                    <table className="w-full border-collapse">
                                        <tbody>
                                        {parameters
                                            .filter(parameter => 
                                                newPolygon.POLYGON_PARAMETERS?.some(p => p.PARAMETER_ID === parameter.PARAMETER_ID)
                                            )
                                            .map((parameter, index) => (
                                                <tr key={index}>
                                                    <td className="p-2">{parameter.PARAMETER_NAME}</td>
                                                    <td className="p-2">
                                                        <CustomParameterInput 
                                                            parameter={parameter}
                                                            editable
                                                            value={newPolygon.POLYGON_PARAMETERS.find(p => p.PARAMETER_ID === parameter.PARAMETER_ID)?.DEFAULT_VALUE || ""}
                                                            onChange={(value) => {
                                                                setNewPolygon((prev) => ({
                                                                    ...prev,
                                                                    POLYGON_PARAMETERS: prev.POLYGON_PARAMETERS.map(p =>
                                                                        p.PARAMETER_ID === parameter.PARAMETER_ID
                                                                            ? { ...p, DEFAULT_VALUE: value }
                                                                            : p
                                                                    ),
                                                                }));
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="p-2 text-xs">{parameter.PARAMETER_UNIT}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                            <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={handleCancelAddPolygon}>Cancel</button>
                            <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={handlePolygonAddition}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* IMPORT FROM CSV MODAL */}
            {showImportFromCSVModal && (
                <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                    <div className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h1 className="font-bold  text-xl">IMPORT POLYGONS FROM CSV</h1>
                            <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowImportFromCSVModal(false)}><FontAwesomeIcon icon={faClose} /></button>
                        </div>

                        <div className="overflow-auto bg-primary flex-1 flex flex-col">
                            <CustomFileUpload handleImport={handleImportCsvForPolygons}/>
                        </div>

                        <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                            <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={cancelImportFromCSV}>Cancel</button>
                            
                            { importedPolygons.length > 0 && (
                                <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={() => uploadCsvImportedPolygons(importedPolygons)}>Import</button>
                            )}

                            {importedPolygons.length == 0 && (
                                <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={downloadTemplate}>Download Template</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LoadManagePolygons;