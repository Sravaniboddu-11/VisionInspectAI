import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <nav className="navbar">

      {/* BRAND */}
      <div className="navbar-brand">
        <Link to="/dashboard">

          <div className="navbar-logo">
            VI
          </div>

          <div className="brand-text">
            <strong>VisionInspectAI</strong>
            <small>Smart Quality Inspection</small>
          </div>

        </Link>
      </div>

      {/* NAVIGATION */}
      <div className="navbar-links">

        <Link
          to="/dashboard"
          className={`nav-item ${
            isActive("/dashboard") ? "active" : ""
          }`}
        >
          Dashboard
        </Link>

        <Link
          to="/upload"
          className={`nav-item ${
            isActive("/upload") ? "active" : ""
          }`}
        >
          Upload Product Image
        </Link>

        <Link
          to="/detection"
          className={`nav-item ${
            isActive("/detection") ? "active" : ""
          }`}
        >
          Detection
        </Link>

        <Link
          to="/results"
          className={`nav-item ${
            isActive("/results") ? "active" : ""
          }`}
        >
          Inspection Results
        </Link>

        {/* PROFILE */}
        <Link
          to="/profile"
          className={`nav-item ${
            isActive("/profile") ? "active" : ""
          }`}
        >
          Profile
        </Link>

        {/* DIRECT LOGOUT BUTTON */}
        <button
          type="button"
          className="navbar-logout"
          onClick={logout}
        >
          Logout
        </button>

      </div>

    </nav>
  );
}

export default Navbar;