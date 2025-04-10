import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

function FloatingLabelInput({ label, type, name }) {
    const [focused, setFocused] = useState(false);
    const [value, setValue] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";

    return (
        <div className="relative w-full" id="custom-label">
            <label 
                htmlFor={name}
                className={`absolute left-3 text-sm transition-all duration-200 px-1 
                    ${focused || value ? "top-0 transform -translate-y-1/2 text-xs text-contrast focused" : "top-1/2 transform -translate-y-1/2 text-gray-500"}
                `}
            >
                <span className="relative z-10 px-1">
                    {label}
                </span>
            </label>

            <input
                id={name}
                type={isPassword && !showPassword ? "password" : "text"}
                name={name}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(value !== "")}
                className="p-2 w-full border rounded-md bg-primary border text-sm focus:outline-none pt-4 pr-10"
            />

            {isPassword && (
                <FontAwesomeIcon 
                    icon={showPassword ? faEye : faEyeSlash} 
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer p-2"
                    onClick={() => setShowPassword(!showPassword)}
                />
            )}
        </div>
    );
}

export default FloatingLabelInput;