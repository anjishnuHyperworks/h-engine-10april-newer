import React from "react";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdd, faSearch, faTrash, faClose, faEdit, faCancel, faCaretUp, faCaretDown, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { faSquareCheck } from "@fortawesome/free-regular-svg-icons";

import CustomChipText from '../components/chip'
import LoadLoader from "../components/loading";
import { get_all_users, add_user, delete_selected_users, update_user } from '../connectors/users';

import { useSignIn } from "../contexts/signInContext";
import { useMessage } from "../contexts/messageContext";

import Tooltip from "../components/tooltip";

function LoadManageUsers() {

    const { showMessage } = useMessage();
    const { signedInUser, encryptionKey } = useSignIn();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const searchColumns = ["EMAIL", "ROLE", "DISPLAY_NAME", "LAST_LOGIN_LOCATION", "LAST_LOGIN", "STATUS"];
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showUserProfileModal, setShowUserProfileModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
    const [showDeleteSelectedUsersModal, setShowDeleteSelectedUsersModal] = useState(false);
    
    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(selectedUser);
    
    const [usersSelectedForDelete, setUsersSelectedForDelete] = useState([]);
    const [showSelectColumn, setShowSelectColumn] = useState(false);
    
    const [newUser, setNewUser] = useState({
        EMAIL: "",
        DISPLAY_NAME: "",
        FIRST_NAME: "",
        LAST_NAME: "",
        COMPANY: "",
        ROLE: "user",
        STATUS: "pending",
    });

    const loadUsers = () => {
        setLoading(true);
        get_all_users(signedInUser.USER_ID, encryptionKey)
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching users:", error);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadUsers()
    }, [encryptionKey]);

    useEffect(() => {
        setEditingUser(selectedUser);
    }, [selectedUser]);

    const handleUserEditChange = (e) => {
        setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
    }

    const handleUserSelectForDelete = (e, user) => {
        if (e.target.checked) {
            setUsersSelectedForDelete(prev => [...prev, user]);
        } else {
            setUsersSelectedForDelete(prev => prev.filter(u => u.USER_ID !== user.USER_ID));
        }
    };    

    const handleSelectColumnClick = () => {
        setShowSelectColumn(!showSelectColumn);
        setUsersSelectedForDelete([]);
    }

    const handleUserEditSave = () => {

        if (Object.values(editingUser).some(value => value === "")) {
            showMessage("Please fill in all fields", "error");
            return;
        }

        setLoading(true);
        update_user(
            signedInUser.USER_ID, 
            encryptionKey, 
            editingUser.USER_ID, 
            editingUser.DISPLAY_NAME, 
            editingUser.FIRST_NAME, 
            editingUser.LAST_NAME, 
            editingUser.COMPANY, 
            editingUser.ROLE, 
            editingUser.STATUS, 
            signedInUser.USER_ID)
            .then(data => {
                loadUsers();
                showMessage("User updated successfully", "success");
            })
            .catch(error => {
                console.error("Error updating user:", error);
            }).finally(() => {
                setLoading(false);
            });

        setShowEditUserModal(false);
    };

    const handleUserAddition = () => {

        if (Object.values(newUser).some(value => value === "")) {
            showMessage("Please fill in all fields", "error");
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(newUser.EMAIL)) {
            showMessage("Invalid email address", "error");
            return;
        }

        setLoading(true);
        add_user(signedInUser.USER_ID, encryptionKey, newUser.EMAIL, newUser.DISPLAY_NAME, newUser.FIRST_NAME, newUser.LAST_NAME, newUser.COMPANY, newUser.ROLE, signedInUser.USER_ID)
            .then(data => {
                loadUsers();
            })
            .catch(error => {
                console.error("Error adding user:", error);
            }).finally(() => {
                setLoading(false);
            });
    
        setNewUser({
            EMAIL: "",
            DISPLAY_NAME: "",
            FIRST_NAME: "",
            LAST_NAME: "",
            COMPANY: "",
            ROLE: "user",
            STATUS: "pending",
        });
        
        setShowAddUserModal(false);
    };
    
    const handleUserListDeletion = () => {
        const selectedUserIdsForDeletion = usersSelectedForDelete.map(user => user.USER_ID);
        setLoading(true);
        delete_selected_users(signedInUser.USER_ID, encryptionKey, selectedUserIdsForDeletion)
            .then(data => {
                loadUsers();
            })
            .catch(error => {
                console.error("Error deleting users:", error);
            }).finally(() => {;
                setLoading(false);
            });
    
        setUsersSelectedForDelete([]);
        setShowDeleteSelectedUsersModal(false);
    }

    const handleSingleUserDeletion = () => {
        setLoading(true);
        delete_selected_users(signedInUser.USER_ID, encryptionKey, [selectedUser.USER_ID])
            .then(data => {
                loadUsers();
            })
            .catch(error => {
                console.error("Error deleting user:", error);
            }).finally(() => {
                setLoading(false);
            });
    
        setShowDeleteUserModal(false);
    }

    const handleCancelUserAddition = () => {
        setNewUser({
            EMAIL: "",
            DISPLAY_NAME: "",
            FIRST_NAME: "",
            LAST_NAME: "",
            COMPANY: "",
            ROLE: "user",
            STATUS: "pending",
        });
        setShowAddUserModal(false);
    }

    const handleUserRowClick = (e, user) => {
        setSelectedUser(user);
    }

    const handleSort = (columnKey) => {
        setSortConfig((prev) => ({
            key: columnKey,
            direction: prev.key === columnKey && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const sortedUsers = [...users].sort((a, b) => {
        if (!sortConfig.key) return 0;
    
        let valueA = a[sortConfig.key] ?? ""; 
        let valueB = b[sortConfig.key] ?? "";
    
        if (sortConfig.key === "LAST_LOGIN") {
            valueA = valueA ? new Date(valueA) : new Date(0); 
            valueB = valueB ? new Date(valueB) : new Date(0);
        } else if (typeof valueA === "string" && typeof valueB === "string") {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
    
        if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });

    const filteredUsers = sortedUsers.filter(user => 
        searchColumns.some(column => 
            user[column] && user[column].toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        
        <div className="flex flex-col items-center w-full min-h-[calc(100vh-4rem)] p-4">
            
            {loading && <LoadLoader />}
            
            <h1 className="w-full items-start py-[1rem] text-[2rem] font-bold ">User Management</h1>

            <div className="flex justify-between w-full gap-2 sticky top-[4rem] bg-primary py-4 z-0">
                <div className="flex items-center relative w-full">
                    <input type="text"
                        placeholder="Search..."
                        className="w-full bg-white border px-4 py-2 text-sm text-contrast focus:outline-none rounded-lg"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute text-l text-contrast right-4" />
                </div>

                <div className="flex gap-2 items-center">
                    {selectedUser === null && usersSelectedForDelete.length === 0 && (
                        <Tooltip text="Add a new user to the system">
                            <button className="flex items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={() => setShowAddUserModal(true)}>
                                <FontAwesomeIcon icon={faAdd} />
                                <p>Add</p>
                            </button>
                        </Tooltip>
                    )}

                    {selectedUser !== null && (
                        <Tooltip text="View the selected user profile">
                            <button className="flex items-center text-nowrap justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={(e) => setShowUserProfileModal(true)}>
                                <FontAwesomeIcon icon={faCircleInfo} />
                                <p>Show More</p>
                            </button>
                        </Tooltip>
                    )}

                    {selectedUser !== null && (
                        <Tooltip text="Edit the selected user">
                            <button className="flex items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={(e) => setShowEditUserModal(true)}>
                                <FontAwesomeIcon icon={faEdit} />
                                <p>Edit</p>
                            </button>
                        </Tooltip>
                    )}

                    {usersSelectedForDelete.length === 0 && selectedUser && users.length > 1 && (
                        <Tooltip text="Delete the selected user">
                            <button className="flex items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={(e) => setShowDeleteUserModal(true)}>
                                <FontAwesomeIcon icon={faTrash} />
                                <p>Delete</p>
                            </button>
                        </Tooltip>
                    )}

                    {usersSelectedForDelete.length === 0 && selectedUser && users.length > 1 && (
                        <Tooltip text="Deselect the selection">
                            <button className="flex items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={(e) => setSelectedUser(null)}>
                                <FontAwesomeIcon icon={faCancel} />
                                <p>Cancel</p>
                            </button>
                        </Tooltip>
                    )}

                    {usersSelectedForDelete.length > 0 && (
                        <Tooltip text="Delete the selected users">
                            <button className="flex flex-1 text-nowrap items-center justify-center gap-2 bg-white border text-contrast py-2 px-4 rounded-lg text-sm" onClick={() => setShowDeleteSelectedUsersModal(true)}>
                                <FontAwesomeIcon icon={faTrash} />
                                <p>Delete Selected</p>
                            </button>
                        </Tooltip>
                    )}
                    
                    {/* {selectedUser === null && (
                        <Tooltip text={!showSelectColumn ? "Enable selection mode to delete multiple users" : "Disable selection mode"}>
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
                            <th className={`p-2 font-semibold ${showSelectColumn ? "rounded-tl-md" : ""}`}>Selected</th>
                        )}
                        <th className={`p-2 font-semibold ${!showSelectColumn ? "rounded-tl-md" : ""}`}>No.</th>
                        <th className="p-2 cursor-pointer" onClick={() => handleSort("EMAIL")}>
                            Email {sortConfig.key === "EMAIL" ? (sortConfig.direction === "asc" ? <FontAwesomeIcon className="ml-2" icon={faCaretUp} /> : <FontAwesomeIcon className="ml-2" icon={faCaretDown} />) : ""}
                        </th>
                        <th className="p-2 cursor-pointer" onClick={() => handleSort("ROLE")}>
                            Role {sortConfig.key === "ROLE" ? (sortConfig.direction === "asc" ? <FontAwesomeIcon className="ml-2" icon={faCaretUp} /> : <FontAwesomeIcon className="ml-2" icon={faCaretDown} />) : ""}
                        </th>
                        <th className="p-2 cursor-pointer" onClick={() => handleSort("DISPLAY_NAME")}>
                            Display name {sortConfig.key === "DISPLAY_NAME" ? (sortConfig.direction === "asc" ? <FontAwesomeIcon className="ml-2" icon={faCaretUp} /> : <FontAwesomeIcon className="ml-2" icon={faCaretDown} />) : ""}
                        </th>
                        <th className="p-2 cursor-pointer" onClick={() => handleSort("LAST_LOGIN_LOCATION")}>
                            Last Login Location {sortConfig.key === "LAST_LOGIN_LOCATION" ? (sortConfig.direction === "asc" ? <FontAwesomeIcon className="ml-2" icon={faCaretUp} /> : <FontAwesomeIcon className="ml-2" icon={faCaretDown} />) : ""}
                        </th>
                        <th className="p-2 cursor-pointer" onClick={() => handleSort("LAST_LOGIN")}>
                            Last Login Time {sortConfig.key === "LAST_LOGIN" ? (sortConfig.direction === "asc" ? <FontAwesomeIcon className="ml-2" icon={faCaretUp} /> : <FontAwesomeIcon className="ml-2" icon={faCaretDown} />) : ""}
                        </th>
                        <th className="p-2 cursor-pointer rounded-tr-md" onClick={() => handleSort("STATUS")}>
                            Status {sortConfig.key === "STATUS" ? (sortConfig.direction === "asc" ? <FontAwesomeIcon className="ml-2" icon={faCaretUp} /> : <FontAwesomeIcon className="ml-2" icon={faCaretDown} />) : ""}
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {filteredUsers.map((user, rowIndex) => (
                        <tr key={user.USER_ID} className={`border hover:cursor-pointer hover:bg-black hover:bg-opacity-5 text-nowrap ${selectedUser?.USER_ID === user.USER_ID ? 'bg-secondary' : ''}`}  onClick={(event) => handleUserRowClick(event, user)}>
                            
                            {showSelectColumn && (
                                <td className={`p-2 border-b ${rowIndex === users.length - 1 ? showSelectColumn ? "rounded-bl-md" : "" : ''}`}>
                                    <input 
                                    type="checkbox" 
                                    className="w-[1rem] h-[1rem] accent-contrast rounded-lg"
                                    checked={usersSelectedForDelete.some(u => u.USER_ID === user.USER_ID)}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handleUserSelectForDelete(e, user)}  />
                                </td>
                            )}

                            <td className={`p-2 border-b ${rowIndex === users.length - 1 ? !showSelectColumn ? "rounded-bl-md" : "" : ''}`}>{rowIndex + 1}</td>
                            <td className="p-2 border-b">{user.EMAIL || 'NULL'}</td>
                            <td className="p-2 border-b">
                                <CustomChipText 
                                    text={user.ROLE} 
                                    type={user.ROLE.toLowerCase() === 'admin' ? 'info' : 'warning'} 
                                />
                            </td>
                            <td className="p-2 border-b">{user.DISPLAY_NAME}</td>
                            <td className="p-2 border-b">{user.LAST_LOGIN_LOCATION ? user.LAST_LOGIN_LOCATION : 'NULL'}</td>
                            <td className="p-2 border-b">{user.LAST_LOGIN ? new Date(user.LAST_LOGIN).toLocaleString() : 'NULL'}</td>
                            <td className={`p-2 border-b ${rowIndex === users.length - 1 ? "rounded-br-md" : ""}`}>
                                <CustomChipText 
                                    text={user.STATUS.toLowerCase()} 
                                    type={user.STATUS.toLowerCase() === 'active' ? 'success' : user.STATUS.toLowerCase() === 'inactive' ? 'error' : 'warning'} 
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ADD NEW USER MODAL */}
            {showAddUserModal && (
                <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                    <form className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h1 className="font-bold  text-xl">ADD NEW USER</h1>
                            <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowAddUserModal(false)}><FontAwesomeIcon icon={faClose} /></button>
                        </div>

                        <div className="overflow-auto bg-primary flex-1 flex flex-col">
                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">Email <span className="text-error_text">*</span></label>
                                <input 
                                    type="email" 
                                    placeholder="johndoe@gmail.com" 
                                    className="p-2 border rounded-lg"
                                    value={newUser.EMAIL}
                                    required
                                    onChange={(e) => setNewUser({ ...newUser, EMAIL: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col p-4 gap-2 relative">
                                <label className="font-semibold  flex items-center gap-2">Display name <span className="text-error_text">*</span> </label>
                                <input 
                                    type="text" 
                                    placeholder="johndoe" 
                                    className="p-2 border rounded-lg"
                                    value={newUser.DISPLAY_NAME}
                                    required
                                    onChange={(e) => {setNewUser({ ...newUser, DISPLAY_NAME: e.target.value })}}
                                />
                            </div>

                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">First Name <span className="text-error_text">*</span></label>
                                <input 
                                    type="text" 
                                    placeholder="John" 
                                    className="p-2 border rounded-lg"
                                    value={newUser.FIRST_NAME}
                                    required
                                    onChange={(e) => setNewUser({ ...newUser, FIRST_NAME: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">Last Name <span className="text-error_text">*</span></label>
                                <input 
                                    type="text" 
                                    placeholder="Doe" 
                                    className="p-2 border rounded-lg"
                                    value={newUser.LAST_NAME}
                                    required
                                    onChange={(e) => setNewUser({ ...newUser, LAST_NAME: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">Company <span className="text-error_text">*</span></label>
                                <textarea 
                                    placeholder="Company name and other details" 
                                    className="p-2 border rounded-lg" 
                                    rows={4}
                                    value={newUser.COMPANY}
                                    required
                                    onChange={(e) => setNewUser({ ...newUser, COMPANY: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col p-4 gap-2 justify-between">
                                <label className="font-semibold ">Role <span className="text-error_text">*</span></label>
                                <div className="flex gap-4 flex-1 justify-evenly bg-white p-4 rounded-lg border">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="ROLE" 
                                            value="user" 
                                            className="hidden peer"
                                            checked={newUser.ROLE === "user"}
                                            onChange={() => setNewUser({ ...newUser, ROLE: "user" })}
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                        user
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="ROLE" 
                                            value="admin" 
                                            className="hidden peer"
                                            checked={newUser.ROLE === "admin"}
                                            onChange={() => setNewUser({ ...newUser, ROLE: "admin" })}
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                        admin
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                            <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={handleCancelUserAddition}>Cancel</button>
                            <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={handleUserAddition} type="submit">Save</button>
                        </div>
                    </form>
                </div>
            )}

            {/* EDIT EXISTING USER MODAL */}
            {showEditUserModal && selectedUser && (
                <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                    <form className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h1 className="font-bold text-xl">Edit user | <span className="font-semibold text-accent">{selectedUser.EMAIL}</span></h1>
                            <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowEditUserModal(false)}>
                                <FontAwesomeIcon icon={faClose} />
                            </button>
                        </div>

                        <div className="overflow-auto bg-primary flex-1 flex flex-col">
                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">Email</label>
                                <input required disabled readOnly type="text" name="EMAIL" value={editingUser.EMAIL} className="p-2 border rounded-lg" onChange={handleUserEditChange} />
                            </div>

                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">Display name</label>
                                <input required type="text" name="DISPLAY_NAME" value={editingUser.DISPLAY_NAME} className="p-2 border rounded-lg" onChange={handleUserEditChange} />
                            </div>

                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">First Name</label>
                                <input required type="text" name="FIRST_NAME" value={editingUser.FIRST_NAME} className="p-2 border rounded-lg" onChange={handleUserEditChange} />
                            </div>

                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">Last Name</label>
                                <input required type="text" name="LAST_NAME" value={editingUser.LAST_NAME} className="p-2 border rounded-lg" onChange={handleUserEditChange} />
                            </div>

                            <div className="flex flex-col p-4 gap-2">
                                <label className="font-semibold ">Company</label>
                                <textarea required name="COMPANY" value={editingUser.COMPANY} className="p-2 border rounded-lg" rows={4} onChange={handleUserEditChange} />
                            </div>

                            <div className="flex flex-col p-4 gap-2 justify-between">
                                <label className="font-semibold ">Role</label>
                                <div className="flex gap-4 flex-1 justify-evenly bg-white p-4 rounded-lg border">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="ROLE" 
                                            value="user" 
                                            className="hidden peer"
                                            checked={editingUser.ROLE === 'user'}
                                            onChange={handleUserEditChange}
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                        user
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="ROLE" 
                                            value="admin" 
                                            className="hidden peer"
                                            checked={editingUser.ROLE === 'admin'}
                                            onChange={handleUserEditChange}
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                        admin
                                    </label>
                                </div>
                            </div>

                            <div className="flex flex-col p-4 gap-2 justify-between">
                                <label className="font-semibold ">Status</label>
                                <div className="flex gap-4 flex-1 justify-evenly bg-white p-4 rounded-lg border">
                                    
                                    { editingUser.STATUS.toLowerCase() === 'pending' && (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="STATUS" 
                                                value="pending" 
                                                className="hidden peer"
                                                readOnly
                                                disabled
                                                checked={editingUser.STATUS.toLowerCase() === 'pending'}
                                                onChange={handleUserEditChange}
                                            />
                                            <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                            pending
                                        </label>
                                    )}

                                    { editingUser.STATUS.toLowerCase() !== 'pending' && (
                                        <>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="STATUS" 
                                                    value="active" 
                                                    className="hidden peer"
                                                    checked={editingUser.STATUS.toLowerCase() === 'active'}
                                                    onChange={handleUserEditChange}
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
                                                    checked={editingUser.STATUS.toLowerCase() === 'inactive'}
                                                    onChange={handleUserEditChange}
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
                                                    checked={editingUser.STATUS.toLowerCase() === 'suspended'}
                                                    onChange={handleUserEditChange}
                                                />
                                                <div className="w-5 h-5 border-2 border-gray-400 rounded-full peer-checked:border-contrast peer-checked:bg-accent transition-all"></div>
                                                suspended
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                            <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={() => setShowEditUserModal(false)}>Cancel</button>
                            <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={handleUserEditSave} type="submit">Save</button>
                        </div>
                    </form>
                </div>
            )}

            {/* DELETE USER MODAL */}
            {showDeleteUserModal && selectedUser && (
                <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                    <div className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h1 className="font-bold text-xl">DELETE USER | <span className="font-semibold text-accent">{selectedUser.EMAIL}</span></h1>
                            <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowDeleteUserModal(false)}>
                                <FontAwesomeIcon icon={faClose} />
                            </button>
                        </div>

                        <div className="overflow-auto bg-primary flex-1 flex flex-col">
                            <div className="flex flex-col p-4 gap-2">
                                <p>Are you sure you want to delete the user <span className="font-semibold text-accent">{selectedUser.EMAIL} ({selectedUser.DISPLAY_NAME})</span> ?</p>
                            </div>
                        </div>

                        <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                            <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={() => setShowDeleteUserModal(false)}>Cancel</button>
                            <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={handleSingleUserDeletion}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE SELECTED USERS MODAL */}
            {showDeleteSelectedUsersModal && (
                <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                    <div className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h1 className="font-bold  text-xl">DELETE SELECTED USERS</h1>
                            <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowDeleteSelectedUsersModal(false)}>
                                <FontAwesomeIcon icon={faClose} />
                            </button>
                        </div>

                        <div className="overflow-auto bg-primary flex-1 flex flex-col">
                            <div className="flex flex-col p-4 gap-2">
                                <p>Are you sure you want to delete the selected users?</p>
                            </div>

                            <div className="flex flex-col p-4 gap-2">
                                <table className="min-w-full border-separate border-spacing-0 border text-contrast rounded-lg">
                                    <thead>
                                        <tr className="bg-secondary text-left ">
                                            <th className="p-2 rounded-tr-md">Email</th>
                                            <th className="p-2 rounded-tl-md">Display Name</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usersSelectedForDelete.map((user, rowIndex) => (
                                            <tr key={user.USER_ID} className="border text-nowrap">
                                                <td className={`p-2 border-b ${rowIndex === usersSelectedForDelete.length - 1 ? "rounded-bl-md" : ""}`}>
                                                    {user.EMAIL}
                                                </td>
                                                <td className={`p-2 border-b ${rowIndex === usersSelectedForDelete.length - 1 ? "rounded-br-md" : ""}`}>
                                                    {user.DISPLAY_NAME}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                            <button className="py-2 px-4 bg-error_bg border rounded-lg" onClick={() => setShowDeleteSelectedUsersModal(false)}>Cancel</button>
                            <button className="py-2 px-4 bg-contrast text-primary border rounded-lg" onClick={handleUserListDeletion}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* USER PROFILE MODAL */}
            {showUserProfileModal && selectedUser && (
                <div className="fixed top-[4rem] left-0 bg-black bg-opacity-50 backdrop-blur-md w-full z-9999 flex h-[calc(100vh-4rem)] items-center justify-center">
                    <form className="flex flex-col bg-white w-[50vw] max-h-[80vh] rounded-lg">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h1 className="font-bold text-xl">USER PROFILE | <span className="font-semibold text-accent">{selectedUser.EMAIL}</span></h1>
                            <button className="border rounded-lg aspect-square px-2 flex items-center justify-center" onClick={() => setShowUserProfileModal(false)}>
                                <FontAwesomeIcon icon={faClose} />
                            </button>
                        </div>

                        <div className="overflow-auto bg-primary flex-1 flex flex-col">
                            <table className="w-full border-collapse text-left">
                                <tbody>
                                    <tr className="border-b">
                                        <td className="p-4 font-semibold ">Email</td>
                                        <td className="p-4"><input disabled readOnly value={selectedUser.EMAIL} className="p-2 border rounded-lg w-full" /></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4 font-semibold ">Role</td>
                                        <td className="p-4">
                                            <CustomChipText text={selectedUser.ROLE} type={selectedUser.ROLE.toLowerCase() === 'admin' ? 'info' : 'warning'} />
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4 font-semibold ">First Name</td>
                                        <td className="p-4"><input disabled readOnly value={selectedUser.FIRST_NAME} className="p-2 border rounded-lg w-full" /></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4 font-semibold ">Last Name</td>
                                        <td className="p-4"><input disabled readOnly value={selectedUser.LAST_NAME} className="p-2 border rounded-lg w-full" /></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4 font-semibold ">Display Name</td>
                                        <td className="p-4"><input disabled readOnly value={selectedUser.DISPLAY_NAME} className="p-2 border rounded-lg w-full" /></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4 font-semibold ">Company</td>
                                        <td className="p-4"><textarea disabled readOnly value={selectedUser.COMPANY} className="p-2 border rounded-lg w-full" rows={4} /></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4 font-semibold ">Status</td>
                                        <td className="p-4">
                                            <CustomChipText 
                                                text={selectedUser.STATUS.toLowerCase()} 
                                                type={selectedUser.STATUS.toLowerCase() === 'active' ? 'success' : selectedUser.STATUS.toLowerCase() === 'inactive' ? 'error' : 'warning'} 
                                            />
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4 font-semibold ">Last Login Location</td>
                                        <td className="p-4"><textarea value={selectedUser.LAST_LOGIN_LOCATION} disabled readOnly className="p-2 border rounded-lg w-full" rows={4} /></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4 font-semibold ">Last Login</td>
                                        <td className="p-4"><input disabled readOnly value={selectedUser.LAST_LOGIN ? new Date(selectedUser.LAST_LOGIN).toLocaleString() : 'NULL'} className="p-2 border rounded-lg w-full" /></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4 font-semibold ">Created By</td>
                                        <td className="p-4"><textarea disabled readOnly value={selectedUser.CREATED_BY} className="p-2 border rounded-lg w-full" rows={4} /></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4 font-semibold ">Created At</td>
                                        <td className="p-4"><input disabled readOnly value={selectedUser.CREATED_AT ? new Date(selectedUser.CREATED_AT).toLocaleString() : 'NULL'} className="p-2 border rounded-lg w-full" /></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4 font-semibold ">Modified By</td>
                                        <td className="p-4"><textarea disabled readOnly value={selectedUser.MODIFIED_BY} className="p-2 border rounded-lg w-full" rows={4} /></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4 font-semibold ">Modified At</td>
                                        <td className="p-4"><input disabled readOnly value={selectedUser.MODIFIED_AT ? new Date(selectedUser.MODIFIED_AT).toLocaleString() : 'NULL'} className="p-2 border rounded-lg w-full" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between p-4 gap-2 border-t bg-white sticky bottom-0 rounded-br-lg rounded-bl-lg">
                            <button type="button" className="py-2 px-4 bg-error_bg border rounded-lg" onClick={() => setShowUserProfileModal(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default LoadManageUsers;
