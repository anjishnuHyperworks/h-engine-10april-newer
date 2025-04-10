import { useState } from "react";

const CustomFileUpload = ({ handleImport }) => {
    const [fileName, setFileName] = useState("");
    const [error, setError] = useState("");

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        if (file) {
            if (file.name.toLowerCase().endsWith(".csv")) {
                setFileName(file.name);
                setError("");
                handleImport(file);
            } else {
                setFileName("");
                setError("ONLY .CSV FILES ARE ALLOWED");
            }
        }
    };

    return (
        <div className="flex flex-col p-4 gap-2">
            <label 
                className="border-2 border-dashed border-gray-400 rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-gray-600"
            >
                <span className={`${error ? "!text-error_text" : "text-gray-600 "}`}>
                    {error || fileName || "CLICK HERE TO UPLOAD A .CSV FILE"}
                </span>
                <input 
                    type="file" 
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                />
            </label>
        </div>
    );
};

export default CustomFileUpload;