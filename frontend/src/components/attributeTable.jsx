import React, { useState, useEffect } from "react";

function LoadAttributeTable() {
    const [data, setData] = useState([]);

    const downloadAttributeTable = () => {
        const csv = data.map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "PolygonInputs.csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    useEffect(() => {
        async function fetchAndParseCSV() {
            try {
                const response = await fetch("/PolygonInputs.csv");
                const text = (await response.text()).trim();
                const rows = text.split("\n").map(row => row.split(","));
                setData(rows);
            } catch (error) {
                console.error("Error fetching CSV:", error);
            }
        }

        fetchAndParseCSV();
    }, []);

    return (
        <div className="h-fit w-full border border rounded-lg flex flex-col gap-1 bg-white">
            <div className="flex justify-between text-contrast items-center border-b p-2">
                <h1 className="text-lg font-semibold">Attribute Table</h1>
                <button 
                    className="flex items-center gap-1 bg-secondary hover:bg-accent text-contrast p-1 aspect-square rounded-lg justify-center"
                    onClick={downloadAttributeTable}
                    >
                    <span className="material-symbols-outlined">download</span>
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg p-2">
                <table className="min-w-full border-separate border-spacing-0 border border text-contrast rounded-lg">
                    <thead>
                        {data.length > 0 && (
                            <tr className="bg-secondary">
                                {data[0].map((header, index) => (
                                    <th
                                        key={index}
                                        className={`border border p-2 text-left 
                                            ${index === 0 ? "rounded-tl-md" : ""} 
                                            ${index === data[0].length - 1 ? "rounded-tr-md" : ""}`}
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        )}
                    </thead>

                    <tbody>
                        {data.slice(1).map((row, rowIndex) => (
                            <tr key={rowIndex} className="border text-nowrap">
                                {row.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={`border border p-2 
                                            ${rowIndex === data.length - 2 && cellIndex === 0 ? "rounded-bl-md" : ""}
                                            ${rowIndex === data.length - 2 && cellIndex === row.length - 1 ? "rounded-br-md" : ""}
                                        `}
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default LoadAttributeTable;
