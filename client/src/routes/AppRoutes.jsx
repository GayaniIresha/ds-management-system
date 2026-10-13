
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";

import CitizenDashboard from "../pages/citizen/CitizenDashboard";
import CitizenServices from "../pages/citizen/Services";
import MyApplications from "../pages/citizen/MyApplications";
import ApplicationForm from "../pages/citizen/ApplicationForm";
import ApplicationDetails from "../pages/citizen/ApplicationDetails";
import Profile from "../pages/citizen/Profile";
import MyDocuments from "../pages/citizen/MyDocuments";

import AdminCertificates from "../pages/admin/Certificates";
import AdminDashboard from "../pages/admin/AdminDashboard";

import OfficerDashboard from "../pages/officer/OfficerDashboard";

import VerifyCertificate from "../pages/VerifyCertificate";

import Applications from "../pages/officer/Applications";
import Notifications from "../pages/Notifications";

// Protect pages that require login
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("dsmsToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default page */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Public pages */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/certificates/verify/:certificateNumber"
          element={<VerifyCertificate />}
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Citizen Dashboard */}
        <Route
          path="/citizen/dashboard"
          element={
            <ProtectedRoute>
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />

        {/* Citizen Services */}
        <Route
          path="/citizen/services"
          element={
            <ProtectedRoute>
              <CitizenServices />
            </ProtectedRoute>
          }
        />

        {/* My Applications */}
        <Route
          path="/citizen/applications"
          element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          }
        />

        {/* New Application */}
        <Route
          path="/citizen/applications/new"
          element={
            <ProtectedRoute>
              <ApplicationForm />
            </ProtectedRoute>
          }
        />

        {/* Application Details */}
        <Route
          path="/citizen/applications/:id"
          element={
            <ProtectedRoute>
              <ApplicationDetails />
            </ProtectedRoute>
          }
        />

        {/* Citizen Profile */}
        <Route
          path="/citizen/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Citizen Documents */}
        <Route
          path="/citizen/documents"
          element={
            <ProtectedRoute>
              <MyDocuments />
            </ProtectedRoute>
          }
        />

        {/* Admin Certificates */}
        <Route
          path="/admin/certificates"
          element={
            <ProtectedRoute>
              <AdminCertificates />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Officer Dashboard */}
        <Route
          path="/officer/dashboard"
          element={
            <ProtectedRoute>
              <OfficerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
  path="/officer/applications"
  element={
    <ProtectedRoute>
      <Applications />
    </ProtectedRoute>
  }
/>

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
