import React, { useEffect } from "react";
import { useState } from "react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faCircleUser, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import { useSignIn } from "../contexts/signInContext";
import LoadProfile from "./profile";

import { logout } from "../connectors/auth";

function LoadHeader() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const { setSignedIn, signedInUser, setSignedInUser } = useSignIn();

    useEffect(() => {
        const handleClickOutside = (event) => {
            const menuElement = document.getElementById('menu-dropdown');
            if (menuOpen && menuElement && !menuElement.contains(event.target) && !event.target.closest('.menu-button')) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);


    const handleLogout = async () => {
        const userId = signedInUser.USER_ID;
        try {
            localStorage.removeItem('signedInUser');
            await logout(userId);
            setSignedIn(false);
            setSignedInUser(null);
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleDashboard = () => {
        window.location.href = signedInUser.ROLE === 'admin' ? '/admin-dashboard' : '/dashboard';
    }

    return (
        <header className="bg-black text-white text-center flex justify-between items-center p-[0.5rem] sticky top-0 z-[99999999] h-[4rem]">

            <button className="h-[80%] flex text-accent justify-center items-center aspect-square rounded-lg hover:bg-accent hover:text-contrast transition-all transition duration-300" onClick={() => window.history.back()}>
                <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
            </button>

            <div className="flex items-center gap-2 h-full">
                <h2 className="font-poppins tracking-[0.25rem] text-l uppercase">Hydrogen Prospector</h2>
            </div>

            <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-secondary">{signedInUser.DISPLAY_NAME}</p>
                <button className="aspect-square p-2 flex justify-center items-center hover:bg-contrast rounded-lg relative" onClick={() => setProfileOpen(!profileOpen)}>
                    <FontAwesomeIcon icon={faCircleUser} className="text-[1.25rem] text-accent" />
                </button>

                <button className="aspect-square p-2 flex justify-center items-center hover:bg-contrast rounded-lg relative menu-button" onClick={() => setMenuOpen(!menuOpen)}>
                    <FontAwesomeIcon icon={faBars} className="text-[1.25rem] text-accent" />
                </button>
            </div>
            
            {menuOpen && (
                <div id="menu-dropdown" className="fixed top-[4.5rem] right-[0.5rem] bg-black flex flex-col gap-2 p-1 rounded-lg z-[9999]" onClick={() => handleDashboard()}>
                    <button className="text-left flex items-center gap-2 py-1 px-2 hover:bg-secondary hover:text-contrast rounded-md">
                        <p className="text-sm font-semibold">Dashboard</p>
                    </button>
                    <button className="cursor-not-allowed text-left flex items-center gap-2 py-1 px-2 rounded-md">
                        <p className="text-sm font-semibold text-gray-400">Saved Filters</p>
                    </button>
                    <button className="cursor-not-allowed text-left flex items-center gap-2 py-1 px-2 rounded-md">
                        <p className="text-sm font-semibold text-gray-400">Change Password</p>
                    </button>
                    <button className="text-left flex items-center gap-2 py-1 px-2 hover:bg-secondary hover:text-contrast rounded-md" onClick={() => handleLogout()}>
                        <p className="text-sm font-semibold">Logout</p>
                    </button>
                </div>
            )}

            {profileOpen && (
                <LoadProfile setProfileOpen={setProfileOpen} />
            )}

        </header>
    )
}

export default LoadHeader;