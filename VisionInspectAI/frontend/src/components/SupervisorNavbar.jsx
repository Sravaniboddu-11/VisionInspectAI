import React from "react";
import { useNavigate } from "react-router-dom";
import "./SupervisorNavbar.css";

function SupervisorNavbar({ active }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <nav className="vi-supervisor-navbar">

      {/* BRAND */}
      <div className="vi-supervisor-brand">
        <div className="vi-supervisor-brand-mark">
          🔍
        </div>

        <div className="vi-supervisor-brand-text">
          <strong>VisionInspectAI</strong>
          <span>MANUFACTURING QUALITY PLATFORM</span>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="vi-supervisor-nav-links">

        {/* DASHBOARD */}
        <button
          type="button"
          className={
            active === "dashboard"
              ? "vi-supervisor-nav-link vi-supervisor-nav-link-active"
              : "vi-supervisor-nav-link"
          }
          onClick={() => navigate("/supervisor")}
        >
          Dashboard
        </button>

        {/* INSPECTION RESULTS */}
        <button
          type="button"
          className={
            active === "results"
              ? "vi-supervisor-nav-link vi-supervisor-nav-link-active"
              : "vi-supervisor-nav-link"
          }
          onClick={() => navigate("/supervisor/results")}
        >
          Inspection Results
        </button>

        {/* DEFECT ANALYSIS */}
        <button
          type="button"
          className={
            active === "analytics"
              ? "vi-supervisor-nav-link vi-supervisor-nav-link-active"
              : "vi-supervisor-nav-link"
          }
          onClick={() =>
            navigate("/supervisor/analytics")
          }
        >
          Defect Analysis
        </button>

        {/* PRODUCTION QUALITY REPORT */}
        <button
          type="button"
          className={
            active === "report"
              ? "vi-supervisor-nav-link vi-supervisor-nav-link-active"
              : "vi-supervisor-nav-link"
          }
          onClick={() =>
            navigate(
              "/supervisor/production-quality-report"
            )
          }
        >
          Production Quality Report
        </button>

        {/* WEEKLY ANALYTICS */}
        <button
          type="button"
          className={
            active === "weekly"
              ? "vi-supervisor-nav-link vi-supervisor-nav-link-active"
              : "vi-supervisor-nav-link"
          }
          onClick={() =>
            navigate(
              "/supervisor/weekly-analytics"
            )
          }
        >
          Weekly Analytics
        </button>

        {/* PROFILE */}
        <button
          type="button"
          className={
            active === "profile"
              ? "vi-supervisor-nav-link vi-supervisor-nav-link-active"
              : "vi-supervisor-nav-link"
          }
          onClick={() =>
            navigate("/supervisor/profile")
          }
        >
          Profile
        </button>

        {/* LOGOUT */}
        <button
          type="button"
          className="vi-supervisor-logout"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </nav>
  );
}

export default SupervisorNavbar;