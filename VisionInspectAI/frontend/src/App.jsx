import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Detection from "./pages/Detection";
import Results from "./pages/Results";
import Profile from "./pages/Profile";

import QualityAnalytics from "./pages/QualityAnalytics";
import ProductionQualityReport from "./pages/ProductionQualityReport";

import Supervisor from "./pages/Supervisor";
import SupervisorResults from "./pages/SupervisorResults";
import SupervisorWeeklyAnalytics from "./pages/SupervisorWeeklyAnalytics";
import SupervisorProfile from "./pages/SupervisorProfile";

// ============================================================
// ROLE PROTECTED ROUTE
// ============================================================

function RoleRoute({ allowedRole, children }) {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  // ------------------------------------------------------------
  // NOT LOGGED IN
  // ------------------------------------------------------------

  if (!token || !userData) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  let user;

  // ------------------------------------------------------------
  // READ USER DATA
  // ------------------------------------------------------------

  try {
    user = JSON.parse(userData);
  } catch (error) {
    console.error(
      "Invalid user data:",
      error
    );

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ------------------------------------------------------------
  // NORMALIZE ROLES
  // ------------------------------------------------------------

  const userRole = String(
    user?.role || ""
  )
    .trim()
    .toLowerCase();

  const requiredRole = String(
    allowedRole || ""
  )
    .trim()
    .toLowerCase();

  // ------------------------------------------------------------
  // WRONG ROLE
  // ------------------------------------------------------------

  if (userRole !== requiredRole) {

    if (
      userRole ===
      "factory supervisor"
    ) {
      return (
        <Navigate
          to="/supervisor"
          replace
        />
      );
    }

    if (
      userRole ===
      "quality engineer"
    ) {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

// ============================================================
// APP
// ============================================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ==================================================
            AUTHENTICATION
        ================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        <Route
          path="/register"
          element={
            <Register />
          }
        />

        {/* ==================================================
            QUALITY ENGINEER
        ================================================== */}

        <Route
          path="/dashboard"
          element={
            <RoleRoute
              allowedRole="Quality Engineer"
            >
              <Dashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <RoleRoute
              allowedRole="Quality Engineer"
            >
              <Upload />
            </RoleRoute>
          }
        />

        <Route
          path="/detection"
          element={
            <RoleRoute
              allowedRole="Quality Engineer"
            >
              <Detection />
            </RoleRoute>
          }
        />

        <Route
          path="/results"
          element={
            <RoleRoute
              allowedRole="Quality Engineer"
            >
              <Results />
            </RoleRoute>
          }
        />

        {/* QUALITY ENGINEER PROFILE */}

        <Route
          path="/profile"
          element={
            <RoleRoute
              allowedRole="Quality Engineer"
            >
              <Profile />
            </RoleRoute>
          }
        />

        {/* ==================================================
            FACTORY SUPERVISOR
        ================================================== */}

        {/* SUPERVISOR DASHBOARD */}

        <Route
          path="/supervisor"
          element={
            <RoleRoute
              allowedRole="Factory Supervisor"
            >
              <Supervisor />
            </RoleRoute>
          }
        />

        {/* SUPERVISOR INSPECTION RESULTS */}

        <Route
          path="/supervisor/results"
          element={
            <RoleRoute
              allowedRole="Factory Supervisor"
            >
              <SupervisorResults />
            </RoleRoute>
          }
        />

        {/* SUPERVISOR DEFECT ANALYSIS */}

        <Route
          path="/supervisor/analytics"
          element={
            <RoleRoute
              allowedRole="Factory Supervisor"
            >
              <QualityAnalytics />
            </RoleRoute>
          }
        />

        {/* SUPERVISOR PRODUCTION QUALITY REPORT */}

        <Route
          path="/supervisor/production-quality-report"
          element={
            <RoleRoute
              allowedRole="Factory Supervisor"
            >
              <ProductionQualityReport />
            </RoleRoute>
          }
        />

        {/* SUPERVISOR WEEKLY ANALYTICS */}

        <Route
          path="/supervisor/weekly-analytics"
          element={
            <RoleRoute
              allowedRole="Factory Supervisor"
            >
              <SupervisorWeeklyAnalytics />
            </RoleRoute>
          }
        />

        {/* SUPERVISOR PROFILE */}

        <Route
          path="/supervisor/profile"
          element={
            <RoleRoute
              allowedRole="Factory Supervisor"
            >
              <SupervisorProfile />
            </RoleRoute>
          }
        />

        {/* ==================================================
            UNKNOWN ROUTE
        ================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;