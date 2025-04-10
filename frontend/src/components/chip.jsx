function CustomChipText({ text, type }) {
    const chipStyles = {
        success: "bg-success_bg text-contrast px-2 py-1 rounded-lg text-xs",
        warning: "bg-warning_bg text-contrast px-2 py-1 rounded-lg text-xs",
        error: "bg-error_bg text-contrast px-2 py-1 rounded-lg text-xs",
        info: "bg-info_bg text-contrast px-2 py-1 rounded-lg text-xs",
    };

    return <span className={chipStyles[type]}>{text.toLowerCase()}</span>;
}

export default CustomChipText;