import React from "react";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdd, faSearch, faTrash, faClose, faEdit, faCancel, faFileImport, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { faSquareCheck } from "@fortawesome/free-regular-svg-icons";

import { useSignIn } from '../contexts/signInContext';
import { useMessage } from "../contexts/messageContext"; 

import Tooltip from "../components/tooltip";  

import CustomChipText from '../components/chip'
import CustomFileUpload from '../components/fileUpload';
import LoadLoader from "../components/loading";
import { get_all_parameters, add_parameter, delete_selected_parameters, update_parameter } from '../connectors/parameters';

import Papa from "papaparse";

function LoadManageParameters() {

    const { signedIn, signedInUser, encryptionKey } = useSignIn();
    const { showMessage } = useMessage();
    
    const [parameters, setParameters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importedParameters, setImportedParameters] = useState([]);
    
    const [showAddParameterModal, setShowAddParameterModal] = useState(false);
    const [showParameterProfileModal, setShowParameterProfileModal] = useState(false);
    const [showImportFromCSVModal, setShowImportFromCSVModal] = useState(false);
    const [showEditParameterModal, setShowEditParameterModal] = useState(false);
    const [showDeleteParameterModal, setShowDeleteParameterModal] = useState(false);
    const [showDeleteSelectedParametersModal, setShowDeleteSelectedParametersModal] = useState(false);
    
    const [selectedParameter, setSelectedParameter] = useState(null);
    const [editingParameter, setEditingParameter] = useState(selectedParameter);
    const [parametersSelectedForDelete, setParametersSelectedForDelete] = useState([]);
    const [showSelectColumn, setShowSelectColumn] = useState(false);
    const [newParameter, setNewParameter] = useState({
        PARAMETER_NAME: "",
        PARAMETER_UNIT: "",
        PARAMETER_TYPE: "",
        STATUS: "active",
    });


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
        loadParameters()
    }, [encryptionKey]);

    useEffect(() => {
        setEditingParameter(selectedParameter);
    }, [selectedParameter]);

    const handleParameterEditChange = (e) => {
        setEditingParameter({ ...editingParameter, [e.target.name]: e.target.value });
    }

    const handleParameterSelectForDelete = (e, parameter) => {
        if (e.target.checked) {
            setParametersSelectedForDelete(prev => [...prev, parameter]);
        } else {
            setParametersSelectedForDelete(prev => prev.filter(u => u.PARAMETER_ID !== parameter.PARAMETER_ID));
        }
    };    

    const handleSelectColumnClick = () => {
        setShowSelectColumn(!showSelectColumn);
        setParametersSelectedForDelete([]);
    }

    // UPDATE AN EXISTING PARAMETER
    const handleParameterEditSave = () => {
        setLoading(true);

        if (editingParameter.PARAMETER_TYPE === 'string') {
            if (!editingParameter.PARAMETER_NAME || !editingParameter.PARAMETER_TYPE) {
                showMessage("Parameter name, type, and unit are required.", "error");
                setLoading(false);
                return;
            }
            else if (editingParameter.PARAMETER_TYPE !== 'string') {
                if (!editingParameter.PARAMETER_NAME || !editingParameter.PARAMETER_TYPE || !editingParameter.PARAMETER_UNIT) {
                    showMessage("Parameter name, type, and unit are required.", "error");
                    setLoading(false);
                    return;
                }
            }
        }
    
        setLoading(true);
        update_parameter(
            signedInUser.USER_ID,
            encryptionKey,
            editingParameter.PARAMETER_ID,
            editingParameter.PARAMETER_NAME,
            editingParameter.PARAMETER_TYPE,
            editingParameter.PARAMETER_UNIT,
            editingParameter.STATUS,
            signedInUser.USER_ID
        )
        .then(data => {
            if (data?.error) {
                showMessage(data.error, "error"); 
            } else {
                showMessage("Parameter updated successfully", "success");
                loadParameters();
                setShowEditParameterModal(false);
                setEditingParameter(null);
                setSelectedParameter(null);
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

    // ADD A NEW PARAMETER
    const handleParameterAddition = () => {
        setLoading(true);
    
        add_parameter(
            signedInUser.USER_ID,
            encryptionKey,
            newParameter.PARAMETER_NAME,
            newParameter.PARAMETER_UNIT, 
            newParameter.PARAMETER_TYPE, 
            signedInUser.USER_ID
        )
        .then(data => {
            if (data?.error) {
                showMessage(data.error, "error"); // Show backend error message
            } else {
                showMessage("Parameter added successfully", "success");
                loadParameters();
                setShowAddParameterModal(false);
                setNewParameter({
                    PARAMETER_NAME: "",
                    PARAMETER_UNIT: "",
                    PARAMETER_TYPE: "",
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
    
    // DELETE A LIST OF SELECTED PARAMETERS
    const handleParameterListDeletion = () => {
        const selectedParameterIdsForDeletion = parametersSelectedForDelete.map(parameter => parameter.PARAMETER_ID);
        setLoading(true);
    
        delete_selected_parameters(signedInUser.USER_ID, encryptionKey, selectedParameterIdsForDeletion)
            .then(data => {
                if (data?.error) {
                    showMessage(data.error, "error"); // Show backend error message
                } else {
                    showMessage("Selected parameters deleted successfully", "success");
                    loadParameters();
                    setParametersSelectedForDelete([]);
                    setShowDeleteSelectedParametersModal(false);
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

    // DELETE A SINGLE PARAMETER
    const handleSingleParameterDeletion = () => {
        setLoading(true);
    
        delete_selected_parameters(signedInUser.USER_ID, encryptionKey, [selectedParameter.PARAMETER_ID])
            .then(data => {
                if (data?.error) {
                    showMessage(data.error, "error"); // Show backend error message
                } else {
                    showMessage("Parameter deleted successfully", "success");
                    loadParameters();
                    setShowDeleteParameterModal(false);
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

    const handleImportCsvForParameters = (file) => {
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
                const requiredHeaders = ["PARAMETER_NAME", "PARAMETER_TYPE", "PARAMETER_UNIT"];
    
                if (!requiredHeaders.every((header) => headers.includes(header))) {
                    showMessage(
                        "The CSV file uploaded has no relevant columns. Ensure column names match exactly (case-sensitive).",
                        "error"
                    );
                    return;
                }
    
                const colIndex = {
                    name: headers.indexOf("PARAMETER_NAME"),
                    type: headers.indexOf("PARAMETER_TYPE"),
                    unit: headers.indexOf("PARAMETER_UNIT"),
                };
    
                const parsedData = data
                    .slice(1)
                    .filter((row) => Array.isArray(row) && row.length >= headers.length)
                    .map((row) => ({
                        parameterName: row[colIndex.name]?.trim() || "",
                        parameterType: row[colIndex.type]?.trim() || "",
                        parameterUnit: row[colIndex.unit]?.trim() || "",
                    }))
                    .filter((row) => row.parameterName);
                
                setImportedParameters(parsedData);
            },
            skipEmptyLines: true,
        });
    };    

    const cancelImportFromCSV = () => {
        setImportedParameters([]);
        setShowImportFromCSVModal(false);
    }

    const uploadCsvImportedParameters = (parsedData) => {
        setLoading(true);
        const promises = parsedData.map((row) => {
            return add_parameter(row.parameterName, row.parameterUnit, row.parameterType, signedInUser.USER_ID);
        });
    
        Promise.all(promises)
            .then((responses) => {
                if (responses.every((res) => res.ok)) {
                    showMessage(`All ${parsedData.length} parameters imported successfully.`, "success");
                } else {
                    showMessage("Some parameters failed to import. Please try again.", "error");
                }
                loadParameters();
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error adding parameters:", error);
                setLoading(false);
            })
            .finally(() => {
                setImportedParameters([]);
                setShowImportFromCSVModal(false);
            }
        );
    }

    const downloadTemplate = () => {
        const polygonTemplateFile = '/templates/parameters-template.csv';
        const link = document.createElement('a');
        link.setAttribute('href', polygonTemplateFile);
        link.setAttribute('download', 'parameters_template.csv');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        
        <div className="relative flex flex-col items-center justify-center w-full p-4">
            
            {loading && <LoadLoader />}
            
            { parameters.length === 0 && !loading ? (
                <div className="flex flex-col bg-hover_contrast rounded-lg items-center justify-center w-full h-[calc(100vh-6rem)] gap-[2rem]">
                    <p className="text-lg text-center">No parameters found</p>
                
                    <div className="flex gap-4">
                        <Tooltip text="Create a new custom parameter with name, type and unit">
                            <button className="flex-1 bg-contrast text-primary px-6 py-4 rounded-lg flex justify-center items-center gap-2 whitespace-nowrap text-nowrap" 
                                onClick={() => setShowAddParameterModal(true)}>
                                <FontAwesomeIcon icon={faAdd} className="text-primary" />
                                <p>ADD A PARAMETER</p>
                            </button>
                        </Tooltip>
                        
                        {/* <Tooltip text="Bulk import parameters from CSV file with predefined format">
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
                    <h1 className="w-full items-start py-[1rem] text-[2rem] font-bold ">Parameter Management</h1>

                    <div className="flex justify-between w-full gap-2 sticky top-[4rem] bg-primary py-4">
                        <div className="flex items-center relative w-full">
                            <input type="text"
                                placeholder="Search..."
                                className="w-full bg-white border px-4 py-2 text-sm text-contrast focus:outline-none rounded-lg"
                            />
                            <FontAwesomeIcon icon={faSearch} className="absolute text-l text-contrast right-4" />
                        </div>

                        <div className="flex gap-2 items-center">
                            {selectedParameter === null && parametersSelectedForDelete.length === 0 && (
                                <Tooltip text="Create a new custom parameter with name, type and unit">
                                    <button className="flex items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={() => setShowAddParameterModal(true)}>
                                        <FontAwesomeIcon icon={faAdd} />
                                        <p>Add</p>
                                    </button>
                                </Tooltip>
                            )}

                            {selectedParameter !== null && (
                                <Tooltip text="View the selected parameter profile">
                                    <button className="flex items-center text-nowrap justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={(e) => setShowParameterProfileModal(true)}>
                                        <FontAwesomeIcon icon={faCircleInfo} />
                                        <p>Show More</p>
                                    </button>
                                </Tooltip>
                            )}

                            {selectedParameter !== null && (
                                <Tooltip text="Edit the selected parameter">
                                    <button className="flex items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={(e) => setShowEditParameterModal(true)}>
                                        <FontAwesomeIcon icon={faEdit} />
                                        <p>Edit</p>
                                    </button>
                                </Tooltip>
                            )}

                            {parametersSelectedForDelete.length === 0 && selectedParameter && parameters.length > 1 && (
                                <Tooltip text="Delete the selected parameter">
                                    <button className="flex items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={(e) => setShowDeleteParameterModal(true)}>
                                        <FontAwesomeIcon icon={faTrash} />
                                        <p>Delete</p>
                                    </button>
                                </Tooltip>
                            )}

                            {parametersSelectedForDelete.length === 0 && selectedParameter && parameters.length > 1 && (
                                <Tooltip text="Deselect the selection">
                                    <button className="flex items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={(e) => setSelectedParameter(null)}>
                                        <FontAwesomeIcon icon={faCancel} />
                                        <p>Cancel</p>
                                    </button>
                                </Tooltip>
                            )}

                            {/* {parametersSelectedForDelete.length > 0 && (
                                <Tooltip text="Delete the selected parameters">
                                    <button className="flex flex-1 text-nowrap items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={() => setShowDeleteSelectedParametersModal(true)}>
                                        <FontAwesomeIcon icon={faTrash} />
                                        <p>Delete Selected</p>
                                    </button>
                                </Tooltip>
                            )} */}
                            
                            {/* {selectedParameter === null && (
                                <Tooltip text={!showSelectColumn ? "Enable selection mode to delete multiple parameters" : "Disable selection mode"}>
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
                            <tr className="bg-contrast text-primary text-left">
                                {showSelectColumn && (
                                    <th className="p-2 rounded-tl-md">
                                        Selected
                                    </th>
                                )}
                                <th className={`p-2 ${!showSelectColumn ? "rounded-tl-md" : ""}`}>ID</th>
                                <th className="p-2">Parameter name</th>
                                <th className="p-2">Parameter type</th>
                                <th className="p-2">Parameter unit</th>
                                <th className="p-2 rounded-tr-md">Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {parameters.map((parameter, rowIndex) => (
                                <tr key={parameter.PARAMETER_ID} className={`border text-nowrap hover:bg-black hover:bg-opacity-5 ${selectedParameter?.PARAMETER_ID === parameter.PARAMETER_ID ? 'bg-secondary' : ''}`}  onClick={() => setSelectedParameter(parameter)}>
                                    
                                    {showSelectColumn && (
                                        <td className="p-2 border-b">
                                            <input 
                                            type="checkbox" 
                                            className="w-[1rem] h-[1rem] accent-contrast rounded-lg"
                                            checked={parametersSelectedForDelete.some(u => u.PARAMETER_ID === parameter.PARAMETER_ID)}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleParameterSelectForDelete(e, parameter)} />
                                        </td>
                                    )}

                                    <td className={`p-2 border-b ${rowIndex === parameters.length - 1 ? "rounded-bl-md" : ""}`}>{parameter.PARAMETER_ID || 'NULL'}</td>
                                    <td className="p-2 border-b">{parameter.PARAMETER_NAME}</td>
                                    <td className="p-2 border-b">
                                        <CustomChipText 
                                            text={parameter.PARAMETER_TYPE.toLowerCase()} 
                                            type={parameter.PARAMETER_TYPE.toLowerCase() === 'number' ? 'success' : parameter.PARAMETER_TYPE.toLowerCase() === 'ranged-decimal' ? 'error' : 'warning'} 
                                        />
                                    </td>
                                    <td className="p-2 border-b">{parameter.PARAMETER_UNIT}</td>
                                    <td className="p-2 border-b">
                                        <CustomChipText 
                                            text={parameter.STATUS.toLowerCase()} 
                                            type={parameter.STATUS.toLowerCase() === 'active' ? 'success' : parameter.STATUS.toLowerCase() === 'inactive' ? 'error' : 'warning'} 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>            

                    {/* EDIT EXISTING PARAMETER MODAL */}
                    {showEditParameterModal && selectedParameter && (
                        <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                            <div className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                                <div className="flex justify-between items-center p-4 border-b">
                                    <h1 className="font-bold  text-xl">EDIT PARAMETER | <span className="font-semibold text-accent">{selectedParameter.PARAMETER_NAME}</span></h1>
                                    <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowEditParameterModal(false)}>
                                        <FontAwesomeIcon icon={faClose} />
                                    </button>
                                </div>

                                <div className="overflow-auto bg-primary flex-1 flex flex-col">
                                    <div className="flex flex-col p-4 gap-2">
                                        <label className="font-semibold ">Parameter name</label>
                                        <input type="text" name="PARAMETER_NAME" value={editingParameter.PARAMETER_NAME} className="p-2 border rounded-lg" onChange={handleParameterEditChange} />
                                    </div>

                                    <div className="flex flex-col p-4 gap-2">
                                        <label className="font-semibold ">Parameter type</label>
                                        <div className="flex gap-4 flex-1 justify-evenly bg-white p-4 rounded-lg border">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="PARAMETER_TYPE" 
                                                    value="number" 
                                                    className="hidden peer"
                                                    checked={editingParameter.PARAMETER_TYPE === "number"}
                                                    onChange={() => setEditingParameter({ ...editingParameter, PARAMETER_TYPE: "number" })}
                                                />
                                                <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                                number
                                            </label>

                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="PARAMETER-TYPE" 
                                                    value="string" 
                                                    className="hidden peer"
                                                    checked={editingParameter.PARAMETER_TYPE === "string"}
                                                    onChange={() => setEditingParameter({ ...editingParameter, PARAMETER_TYPE: "string" })}
                                                />
                                                <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                                string
                                            </label>

                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="parameter-create-TYPE" 
                                                    value="ranged-decimal" 
                                                    className="hidden peer"
                                                    checked={editingParameter.PARAMETER_TYPE === "ranged-decimal"}
                                                    onChange={() => setEditingParameter({ ...editingParameter, PARAMETER_TYPE: "ranged-decimal" })}
                                                />
                                                <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                                ranged decimal (0-1)
                                            </label>
                                        </div>
                                    </div>

                                    {editingParameter.PARAMETER_TYPE !== 'string' && (
                                        <div className="flex flex-col p-4 gap-2">
                                            <label className="font-semibold ">Parameter unit</label>
                                            <input type="text" name="PARAMETER_NAME" value={editingParameter.PARAMETER_UNIT} className="p-2 border rounded-lg" onChange={handleParameterEditChange} />
                                        </div>
                                    )}

                                    <div className="flex flex-col p-4 gap-2 justify-between">
                                        <label className="font-semibold ">Status</label>
                                        <div className="flex gap-4 flex-1 justify-evenly bg-white p-4 rounded-lg border">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="STATUS" 
                                                    value="active" 
                                                    className="hidden peer"
                                                    checked={editingParameter.STATUS.toLowerCase() === 'active'}
                                                    onChange={handleParameterEditChange}
                                                />
                                                <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                                active
                                            </label>

                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="STATUS" 
                                                    value="inactive" 
                                                    className="hidden peer"
                                                    checked={editingParameter.STATUS.toLowerCase() === 'inactive'}
                                                    onChange={handleParameterEditChange}
                                                />
                                                <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                                inactive
                                            </label>

                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="STATUS" 
                                                    value="suspended" 
                                                    className="hidden peer"
                                                    checked={editingParameter.STATUS.toLowerCase() === 'suspended'}
                                                    onChange={handleParameterEditChange}
                                                />
                                                <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                                suspended
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                                    <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={() => setShowEditParameterModal(false)}>Cancel</button>
                                    <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={handleParameterEditSave}>Save</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DELETE PARAMETER MODAL */}
                    {showDeleteParameterModal && selectedParameter && (
                        <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                            <div className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                                <div className="flex justify-between items-center p-4 border-b">
                                    <h1 className="font-bold  text-xl">DELETE PARAMETER | <span className="font-semibold text-accent">{selectedParameter.PARAMETER_NAME}</span></h1>
                                    <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowDeleteParameterModal(false)}>
                                        <FontAwesomeIcon icon={faClose} />
                                    </button>
                                </div>

                                <div className="overflow-auto bg-primary flex-1 flex flex-col">
                                    <div className="flex flex-col p-4 gap-2">
                                        <p>Are you sure you want to delete the parameter <span className="font-semibold text-accent">{selectedParameter.PARAMETER_NAME} ({selectedParameter.PARAMETER_NAME})</span> ?</p>
                                    </div>
                                </div>

                                <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                                    <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={() => setShowDeleteParameterModal(false)}>Cancel</button>
                                    <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={handleSingleParameterDeletion}>Delete</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DELETE SELECTED PARAMETERS MODAL */}
                    {showDeleteSelectedParametersModal && (
                        <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                            <div className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                                <div className="flex justify-between items-center p-4 border-b">
                                    <h1 className="font-bold  text-xl">Delete Selected Parameters</h1>
                                    <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowDeleteSelectedParametersModal(false)}>
                                        <FontAwesomeIcon icon={faClose} />
                                    </button>
                                </div>

                                <div className="overflow-auto bg-primary flex-1 flex flex-col">
                                    <div className="flex flex-col p-4 gap-2">
                                        <p>Are you sure you want to delete the selected parameters?</p>
                                    </div>

                                    <div className="flex flex-col p-4 gap-2">
                                        <table className="min-w-full border-separate border-spacing-0 border text-contrast rounded-lg">
                                            <thead>
                                                <tr className="bg-secondary text-left ">
                                                    <th className="p-2 rounded-tl-md">Parameter Name</th>
                                                    <th className="p-2 rounded-tr-md">Parameter Type</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parametersSelectedForDelete.map((parameter, rowIndex) => (
                                                    <tr key={parameter.PARAMETER_ID} className="border text-nowrap">
                                                        <td className={`p-2 border-b ${rowIndex === parametersSelectedForDelete.length - 1 ? "rounded-bl-md" : ""}`}>
                                                            {parameter.PARAMETER_NAME}
                                                        </td>
                                                        <td className="p-2 border-b">
                                                            <CustomChipText 
                                                                text={parameter.PARAMETER_TYPE.toLowerCase()} 
                                                                type={parameter.PARAMETER_TYPE.toLowerCase() === 'number' ? 'success' : parameter.PARAMETER_TYPE.toLowerCase() === 'ranged-decimal' ? 'error' : 'warning'} 
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                                    <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={() => setShowDeleteSelectedParametersModal(false)}>Cancel</button>
                                    <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={handleParameterListDeletion}>Delete</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ADD NEW PARAMETER MODAL */}
            {showAddParameterModal && (
                <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                    <div className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h1 className="font-bold  text-xl">ADD NEW PARAMETER</h1>
                            <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowAddParameterModal(false)}><FontAwesomeIcon icon={faClose} /></button>
                        </div>

                        <div className="overflow-auto bg-primary flex-1 flex flex-col">
                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">Parameter Name</label>
                                <input 
                                    type="text" 
                                    placeholder="S1" 
                                    className="p-2 border rounded-lg"
                                    value={newParameter.PARAMETER_NAME}
                                    onChange={(e) => setNewParameter({ ...newParameter, PARAMETER_NAME: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">Parameter Unit</label>
                                <input 
                                    type="text" 
                                    placeholder="Feet" 
                                    className="p-2 border rounded-lg"
                                    value={newParameter.PARAMETER_UNIT}
                                    onChange={(e) => setNewParameter({ ...newParameter, PARAMETER_UNIT: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">Parameter Type</label>
                                <div className="flex gap-4 flex-1 justify-evenly bg-white p-4 rounded-lg border">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="PARAMETER_TYPE" 
                                            value="number" 
                                            className="hidden peer"
                                            checked={newParameter.PARAMETER_TYPE === "number"}
                                            onChange={() => setNewParameter({ ...newParameter, PARAMETER_TYPE: "number" })}
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                        number
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="PARAMETER-TYPE" 
                                            value="string" 
                                            className="hidden peer"
                                            checked={newParameter.PARAMETER_TYPE === "string"}
                                            onChange={() => setNewParameter({ ...newParameter, PARAMETER_TYPE: "string" })}
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                        string
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="parameter-create-TYPE" 
                                            value="ranged-decimal" 
                                            className="hidden peer"
                                            checked={newParameter.PARAMETER_TYPE === "ranged-decimal"}
                                            onChange={() => setNewParameter({ ...newParameter, PARAMETER_TYPE: "ranged-decimal" })}
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                        ranged decimal (0-1)
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                            <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={() => setShowAddParameterModal(false)}>Cancel</button>
                            <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={handleParameterAddition}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* IMPORT FROM CSV MODAL */}
            {showImportFromCSVModal && (
                <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                    <div className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h1 className="font-bold  text-xl">IMPORT PARAMETERS FROM CSV</h1>
                            <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowImportFromCSVModal(false)}><FontAwesomeIcon icon={faClose} /></button>
                        </div>

                        <div className="overflow-auto bg-primary flex-1 flex flex-col">
                            <CustomFileUpload handleImport={handleImportCsvForParameters}/>
                        </div>

                        <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                            <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={cancelImportFromCSV}>Cancel</button>
                            { importedParameters.length > 0 && (
                                <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={() => uploadCsvImportedParameters(importedParameters)}>Import</button>
                            )}

                            { importedParameters.length == 0 && (
                                <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={downloadTemplate}>Download Template</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LoadManageParameters;