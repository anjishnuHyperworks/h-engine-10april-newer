import React, { useState, useEffect } from "react";
import FloatingLabelInput from "../components/floatingLabelInput";
import { useLocation } from "react-router-dom";
import { change_password, get_user_email_and_status, send_otp } from "../connectors/auth";
import { useMessage } from "../contexts/messageContext";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faIdBadge } from "@fortawesome/free-solid-svg-icons";

function LoadCompleteSignup() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const UUID = queryParams.get("for");

    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("");
    const { showMessage } = useMessage();

    useEffect(() => {
        if (!UUID) return;
    
        get_user_email_and_status(UUID)
            .then((res) => {
                if (res.status === 404) {
                    window.location.href = "/404";
                    return null;
                }
                if (!res.ok) {
                    throw new Error("Failed to fetch user details");
                }
                return res.json();
            })
            .then((data) => {
                if (data) setEmail(data.EMAIL);
                if (data) setStatus(data.STATUS);
            })
            .catch((err) => {
                console.error("Error fetching email:", err);
            });
    }, [UUID]);

    const handleChangePassword = async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById("new-password")?.value || "";
        const confirmPassword = document.getElementById("confirm-password")?.value || "";

        if (!email || newPassword === "" || confirmPassword === "") {
            showMessage("Please fill in all fields", "error");
            return;
        }

        if (newPassword.length < 8) {
            showMessage("Password must be at least 8 characters", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage("New passwords do not match", "error");
            return;
        }

        try {
            const response = await change_password(email, newPassword);
            if (response.ok) {
                showMessage("Password changed successfully", "success");
                window.location.href = "/";
            } else {
                showMessage("Failed to change password", "error");
            }
        } catch (err) {
            console.error(err);
            showMessage("Failed to change password", "error");
        }
    };

    return (
        <div className="flex justify-center items-center h-screen w-full bg-primary">
            {status.toLowerCase() === 'pending' ? (
                <div className="flex rounded-lg w-1/2 max-w-[60vw] bg-white h-[60%]">
                    <div className="flex flex-col w-1/2 overflow-hidden rounded-tl-lg rounded-bl-lg relative">
                        <div className="h-full relative overflow-hidden">
                            <img
                                src="/texture.jpg"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <img 
                            src="/koloma-logo.png" 
                            alt="koloma-logo" 
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[25%] h-auto max-w-1/2 max-h-1/2"
                        />
                    </div>

                    <div className="p-5 flex flex-col gap-10 w-1/2 rounded-tr-lg rounded-br-lg justify-between items-center">
                    
                        <div className="flex justify-center items-center w-full flex-1">
                            <h1 className="uppercase font-bold text-2xl">Complete Signing Up</h1>
                        </div>

                        <div className="flex flex-col gap-6 w-full flex-1">
                            <input
                                type="text"
                                value={email}
                                readOnly
                                disabled
                                className="p-3 w-full border rounded-md bg-primary border text-sm focus:outline-none"
                            />
                            <FloatingLabelInput
                                label="New Password"
                                type="password"
                                name="new-password"
                            />
                            <FloatingLabelInput
                                label="Confirm New Password"
                                type="password"
                                name="confirm-password"
                            />
                            <button
                                className="p-2 text-primary bg-contrast rounded-md w-full"
                                onClick={handleChangePassword}
                            >
                                Change Password
                            </button>
                        </div>

                        <span className="flex-1"></span>
                    </div>
                </div>
            ) : (
                <div className="text-contrast flex flex-col justify-center items-center gap-[2.5vh]">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-9xl text-contrast" />
                    <h1 className="text-center">You are already verified !<br />Login to access the dashboard</h1>
                    <a href="/login" className="bg-white hover:bg-secondary transition border px-[2vw] py-2 rounded-lg">Login</a>
                </div>
            )}
        </div>
    );
}

export default LoadCompleteSignup;
