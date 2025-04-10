import React, { useState, useEffect } from "react";
import { get_unique_values_for_string_parameters } from '../connectors/parameters';

import { useSignIn } from "../contexts/signInContext";

const CustomParameterInput = ({ parameter, editable = false, defaultValue, onChange }) => {
    const [value, setValue] = useState(defaultValue ?? "");
    const [parameterOptions, setParameterOptions] = useState({});
    const [showSuggestions, setShowSuggestions] = useState(false);

    const { encryptionKey, signedInUser } = useSignIn();

    useEffect(() => {
        if (parameter && parameter.PARAMETER_TYPE === "string") {
            get_unique_values_for_string_parameters(signedInUser.USER_ID, encryptionKey)
                .then(data => {
                    setParameterOptions(data || {});
                })
                .catch(error => {
                    console.error("Error fetching parameter options:", error);
                    setParameterOptions({});
                });
        }
    }, [parameter, encryptionKey]);

    useEffect(() => {
        setValue(defaultValue ?? "");
    }, [defaultValue]);

    const handleValueChange = (newValue) => {
        setValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    const handleInputChange = (e) => {
        handleValueChange(e.target.value);
    };

    const handleSelectOption = (option) => {
        handleValueChange(option);
        setShowSuggestions(false);
    };

    const options = parameterOptions[parameter.PARAMETER_ID] || [];

    const filteredOptions = options.filter(option => 
        option.toLowerCase().includes((value || "").toLowerCase())
    );

    switch (parameter.PARAMETER_TYPE) {
        case "number":
            return (
                <input
                    type="number"
                    className="border px-2 py-1 w-full rounded-lg focus:outline-accent"
                    value={value || 0}
                    onChange={handleInputChange}
                />
            );

        case "ranged-decimal":
            return (
                <div className="flex items-center gap-2 w-full">
                    <input
                        type="range"
                        step="0.001"
                        min={0}
                        max={1}
                        value={value}
                        onChange={handleInputChange}
                        className="w-full accent-contrast"
                    />
                    <span className="text-black">{Number(value || 0.5).toFixed(3)}</span>
                </div>
            );

        case "string":
            return (
                <div className="relative flex flex-col gap-1">
                    {editable ? (
                        <>
                            <input
                                type="text"
                                className="border p-1 w-full rounded-lg focus:outline-accent"
                                value={value}
                                onChange={handleInputChange}
                                placeholder="Type to search or enter a new value"
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            />
                            {showSuggestions && filteredOptions.length > 0 && (
                                <ul className="absolute left-0 right-0 top-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-auto z-10">
                                    {filteredOptions.map((option, index) => (
                                        <li
                                            key={index}
                                            className="p-2 hover:bg-gray-200 cursor-pointer"
                                            onMouseDown={() => handleSelectOption(option)}
                                        >
                                            {option}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    ) : (
                        <select
                            className="border p-1 w-full rounded-lg focus:outline-accent"
                            value={value}
                            onChange={handleInputChange}
                        >
                            <option value="" disabled>Select an option</option>
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option, index) => (
                                    <option key={index} value={option}>{option}</option>
                                ))
                            ) : (
                                <option value="" disabled>No options available</option>
                            )}
                        </select>
                    )}
                </div>
            );

        default:
            return (
                <input
                    type="text"
                    className="border p-1 w-full focus:outline-accent"
                    value={value}
                    onChange={handleInputChange}
                />
            );
    }
};

export default CustomParameterInput;