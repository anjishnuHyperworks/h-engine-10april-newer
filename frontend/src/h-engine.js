import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { SignInContextProvider, useSignIn } from './contexts/signInContext.jsx';
import { MessageProvider } from './contexts/messageContext.jsx';

import LoadHeader from './components/header.jsx';
import LoadDashboard from './pages/dashboard.jsx';
import LoadLogin from './pages/login.jsx';
import LoadErrorPage from './pages/404.jsx';
import LoadAdminDashboard from './pages/admin-dashboard.jsx';
import LoadManageUsers from './pages/manage-users.jsx';
import LoadManagePolygons from './pages/manage-polygons.jsx';
import LoadManageParameters from './pages/manage-parameters.jsx';
import LoadCompleteSignup from './pages/complete-signup.jsx';

function HydrogenEngine() {
  return (
    <SignInContextProvider>
      <MessageProvider>
        <HydrogenApp />
      </MessageProvider>
    </SignInContextProvider>
  );
}

const ProtectedRoute = ({ element }) => {
  const { signedIn } = useSignIn();
  return signedIn ? element : < LoadLogin />;
};

function HydrogenApp() {
  let { signedIn, signedInUser } = useSignIn();

  return (
    <Router>
      {signedIn && <LoadHeader />}
      <Routes>
        <Route path="/" element={signedIn ? signedInUser.ROLE.toLowerCase() == 'admin' ? <LoadAdminDashboard /> : <LoadDashboard /> : <Navigate to={'login'} />} />
        <Route path="/login" element={signedIn ? signedInUser.ROLE.toLowerCase() == 'admin' ?  <Navigate to={'/admin-dashboard'} />: <Navigate to={'/dashboard'} /> : <LoadLogin />} />
        <Route path="/complete-signup" element={signedIn ? <Navigate to='/'/> : <LoadCompleteSignup />} />
        <Route path="/404" element={<LoadErrorPage />} />

        <Route path="/dashboard" element={<ProtectedRoute element={<LoadDashboard />} />} />
        
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute element={signedInUser?.ROLE.toLowerCase() === "admin" ? <LoadAdminDashboard /> : <Navigate to={'/dashboard'} /> } />
          }
        />
        
        <Route path="/manage-users" element={<ProtectedRoute element={<LoadManageUsers />} />} />
        <Route path="/manage-polygons" element={<ProtectedRoute element={<LoadManagePolygons />} />} />
        <Route path="/manage-parameters" element={<ProtectedRoute element={<LoadManageParameters />} />} />

        <Route path="*" element={<LoadErrorPage />} />
      </Routes>
    </Router>
  );
}

export default HydrogenEngine;