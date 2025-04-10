import React from "react";
import { useNavigate } from "react-router-dom";

import Tooltip from "../components/tooltip";

function LoadAdminDashboard() {

    const navigate = useNavigate();
    const handleNavigation = (path) => {
        navigate(path);
    }

    return (
        <div className="flex flex-col items-center justify-between h-screen w-full bg-primary p-2">
            
            <div className="flex h-[20vh] justify-center items-center flex-1 w-full">
                <h1 className="text-[2rem] font-bold">Admin Dashboard</h1>
            </div>

            <div className="grid grid-cols-3 gap-[1rem] text-center flex-1 w-[75vw]">
                <Tooltip text="Access the general dashboard with overview and basic functionalities">
                    <button className="border h-full w-full rounded-lg hover:bg-secondary transition duration-300 ease-in-out bg-white" onClick={() => handleNavigation('/dashboard')}>General Dashboard</button>
                </Tooltip>

                <Tooltip text="Manage user accounts, roles, and permissions">
                    <button className="border h-full w-full rounded-lg hover:bg-secondary transition duration-300 ease-in-out bg-white" onClick={() => handleNavigation('/manage-users')}>Manage Users</button>
                </Tooltip>

                <Tooltip text="Create, edit, and delete polygon areas for analysis">
                    <button className="border h-full w-full rounded-lg hover:bg-secondary transition duration-300 ease-in-out bg-white" onClick={() => handleNavigation('/manage-polygons')}>Manage Polygons</button>
                </Tooltip>

                <Tooltip text="Create, edit, and delete parameters for polygons (Coming Soon)">
                    <button className="border h-full w-full rounded-lg cursor-not-allowed" onClick={() => handleNavigation('/manage-parameters')} disabled>Manage Parameters</button>
                    {/* <button className="border h-full w-full rounded-lg hover:bg-secondary transition duration-300 ease-in-out bg-white" onClick={() => handleNavigation('/manage-parameters')}>Manage Parameters</button> */}
                </Tooltip>

                <Tooltip text="System configuration options (Coming Soon)">
                    <button className="border h-full w-full rounded-lg cursor-not-allowed" onClick={() => handleNavigation('/manage-configs')} disabled>Manage Configurations</button>
                </Tooltip>

                <Tooltip text="Control access permissions for polygons (Coming Soon)">
                    <button className="border h-full w-full rounded-lg cursor-not-allowed" onClick={() => handleNavigation('/polygon-access-control')} disabled>Polygon Access Control</button>
                </Tooltip>
            </div>

            <span className="flex-1"></span>
        </div>
    );
}

export default LoadAdminDashboard;