import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import { useSignIn } from "../contexts/signInContext";

import CustomChipText from "../components/chip";

function LoadProfile({ setProfileOpen }) {
    const { signedInUser } = useSignIn();
    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState(signedInUser);

    const handleEdit = (e) => {
        e.preventDefault();
        setIsEditing(true);
    };

    const handleCancel = (e) => {
        e.preventDefault();
        if (isEditing) {
            setIsEditing(false);
            setUserData(signedInUser);
        } else {
            setProfileOpen(false);
        }
    };

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-50 flex h-[calc(100vh-4rem)] items-center justify-center">
            <form className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg text-black">
                <div className="flex justify-between items-center p-4 border-b">
                    <h1 className="font-bold text-xl">PROFILE</h1>
                    <button type="button" className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setProfileOpen(false)}>
                        <FontAwesomeIcon icon={faClose} />
                    </button>
                </div>

                <div className="overflow-auto bg-primary flex-1">
                    <table className="w-full border-collapse text-left">
                        <tbody>
                            <tr className="border-b">
                                <td className="p-4 font-semibold ">Email</td>
                                <td className="p-4"><input disabled readOnly type="text" name="EMAIL" value={userData.EMAIL} className="p-2 border rounded-lg w-full" /></td>
                            </tr>
                            <tr className="border-b">
                                <td className="p-4 font-semibold ">Role</td>
                                <td className="p-4">
                                    <CustomChipText text={userData.ROLE} type={userData.ROLE.toLowerCase() === 'admin' ? 'info' : 'warning'} />
                                </td>
                            </tr>
                            <tr className="border-b">
                                <td className="p-4 font-semibold ">First Name</td>
                                <td className="p-4"><input type="text" name="FIRST_NAME" value={userData.FIRST_NAME} disabled={!isEditing} onChange={handleChange} className="p-2 border rounded-lg w-full" /></td>
                            </tr>
                            <tr className="border-b">
                                <td className="p-4 font-semibold ">Last Name</td>
                                <td className="p-4"><input type="text" name="LAST_NAME" value={userData.LAST_NAME} disabled={!isEditing} onChange={handleChange} className="p-2 border rounded-lg w-full" /></td>
                            </tr>
                            <tr className="border-b">
                                <td className="p-4 font-semibold ">Display Name</td>
                                <td className="p-4"><input type="text" name="DISPLAY_NAME" value={userData.DISPLAY_NAME} disabled={!isEditing} onChange={handleChange} className="p-2 border rounded-lg w-full" /></td>
                            </tr>
                            <tr className="border-b">
                                <td className="p-4 font-semibold ">Company</td>
                                <td className="p-4"><textarea required name="COMPANY" value={userData.COMPANY} disabled readOnly className="p-2 border rounded-lg w-full" rows={4} /></td>
                            </tr>
                            <tr>
                                <td className="p-4 font-semibold ">Status</td>
                                <td className="p-4">
                                    <CustomChipText 
                                        text={userData.STATUS.toLowerCase()} 
                                        type={userData.STATUS.toLowerCase() === 'active' ? 'success' : userData.STATUS.toLowerCase() === 'inactive' ? 'error' : 'warning'} 
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                    <button type="button" className="py-2 px-4 bg-error_bg border rounded-lg" onClick={handleCancel}>Cancel</button>
                    {isEditing ? (
                        <button type="submit" className="py-2 px-4 bg-contrast text-primary border rounded-lg">Save</button>
                    ) : (
                        <button type="button" className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={handleEdit}>Edit</button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default LoadProfile;
