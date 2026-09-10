import React, { useEffect, useState } from "react";
import SupervisorNavbar from "../components/SupervisorNavbar";
import "./SupervisorProfile.css";

function SupervisorProfile() {
  const [user, setUser] = useState({
    name: "Factory Supervisor",
    email: "Not available",
    role: "Factory Supervisor",
    department: "Production Quality",
    accountStatus: "Active",
    accessLevel: "Factory Supervisor",
    accountType: "Production Monitoring",
  });

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // ============================================================
  // LOAD USER INFORMATION
  // ============================================================

  const loadUser = () => {
    try {
      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const role =
        storedUser?.role ||
        "Factory Supervisor";

      const normalizedUser = {
        name:
          storedUser?.name ||
          storedUser?.full_name ||
          storedUser?.username ||
          "Factory Supervisor",

        email:
          storedUser?.email ||
          "Not available",

        role,

        department:
          storedUser?.department ||
          "Production Quality",

        accountStatus:
          storedUser?.accountStatus ||
          storedUser?.status ||
          "Active",

        accessLevel:
          storedUser?.accessLevel ||
          role,

        accountType:
          storedUser?.accountType ||
          "Production Monitoring",
      };

      setUser(normalizedUser);

      setFormData({
        name: normalizedUser.name,
        email: normalizedUser.email,
      });
    } catch (error) {
      console.error(
        "Error loading Supervisor profile:",
        error
      );
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadUser();

    const handleStorage = () => {
      loadUser();
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  // ============================================================
  // HANDLE INPUT
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setMessageType("");
  };

  // ============================================================
  // EDIT PROFILE
  // ============================================================

  const handleEdit = () => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
    });

    setMessage("");
    setMessageType("");
    setIsEditing(true);
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const handleSave = () => {
    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name) {
      setMessage("Please enter your full name.");
      setMessageType("error");
      return;
    }

    if (!email) {
      setMessage("Please enter your email address.");
      setMessageType("error");
      return;
    }

    try {
      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const updatedUser = {
        ...storedUser,

        name,

        email,

        // Keep supervisor role unchanged.
        role: "Factory Supervisor",

        department:
          storedUser?.department ||
          "Production Quality",

        accountStatus:
          storedUser?.accountStatus ||
          storedUser?.status ||
          "Active",

        accessLevel:
          storedUser?.accessLevel ||
          "Factory Supervisor",

        accountType:
          storedUser?.accountType ||
          "Production Monitoring",
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setUser({
        name,
        email,
        role: "Factory Supervisor",
        department:
          updatedUser.department,
        accountStatus:
          updatedUser.accountStatus,
        accessLevel:
          updatedUser.accessLevel,
        accountType:
          updatedUser.accountType,
      });

      setFormData({
        name,
        email,
      });

      setIsEditing(false);

      setMessage(
        "Profile updated successfully."
      );

      setMessageType("success");
    } catch (error) {
      console.error(
        "Error saving Supervisor profile:",
        error
      );

      setMessage(
        "Unable to update profile."
      );

      setMessageType("error");
    }
  };

  // ============================================================
  // CANCEL EDIT
  // ============================================================

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
    });

    setIsEditing(false);

    setMessage("");
    setMessageType("");
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = () => {
    loadUser();

    setIsEditing(false);

    setMessage(
      "Profile information refreshed."
    );

    setMessageType("success");
  };

  // ============================================================
  // GET INITIALS
  // ============================================================

  const getInitials = () => {
    const name =
      user?.name ||
      "Factory Supervisor";

    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length >= 2) {
      return (
        parts[0][0] +
        parts[parts.length - 1][0]
      ).toUpperCase();
    }

    return name
      .slice(0, 2)
      .toUpperCase();
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="supervisor-profile-page">

      {/* ======================================================
          NAVBAR
          ====================================================== */}

      <SupervisorNavbar active="profile" />

      {/* ======================================================
          MAIN CONTENT
          ====================================================== */}

      <main className="supervisor-profile-main">

        {/* HEADER */}

        <section className="supervisor-profile-header">

          <div>

            <span className="profile-kicker">
              FACTORY SUPERVISOR
            </span>

            <h1>
              Profile
            </h1>

            <p>
              Manage your account information
              and Supervisor access details.
            </p>

          </div>

          <div className="profile-header-actions">

            <div className="profile-active-status">
              <span className="profile-status-dot"></span>
              Account Active
            </div>

            <button
              type="button"
              className="profile-refresh-button"
              onClick={handleRefresh}
            >
              ↻ Refresh
            </button>

          </div>

        </section>

        {/* MESSAGE */}

        {message && (
          <div
            className={`profile-message ${messageType}`}
          >
            {message}
          </div>
        )}

        {/* ====================================================
            PROFILE CARD
            ==================================================== */}

        <section className="supervisor-profile-card">

          {/* PROFILE SUMMARY */}

          <div className="profile-summary">

            <div className="profile-avatar">
              {getInitials()}
            </div>

            <div className="profile-summary-content">

              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  className="profile-name-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                />
              ) : (
                <h2>
                  {user.name}
                </h2>
              )}

              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  className="profile-email-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              ) : (
                <p>
                  {user.email}
                </p>
              )}

              <span className="profile-role-badge">
                {user.role}
              </span>

            </div>

          </div>

          {/* ==================================================
              ACCOUNT DETAILS
              ================================================== */}

          <div className="profile-section">

            <div className="profile-section-heading">

              <span>
                ACCOUNT INFORMATION
              </span>

              <h3>
                Profile Details
              </h3>

            </div>

            <div className="profile-details-grid">

              {/* FULL NAME */}

              <div className="profile-detail">

                <label>
                  Full Name
                </label>

                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    className="profile-edit-input"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="profile-detail-value">
                    {user.name}
                  </div>
                )}

              </div>

              {/* EMAIL */}

              <div className="profile-detail">

                <label>
                  Email Address
                </label>

                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    className="profile-edit-input"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                ) : (
                  <div className="profile-detail-value">
                    {user.email}
                  </div>
                )}

              </div>

              {/* ROLE */}

              <div className="profile-detail">

                <label>
                  Role
                </label>

                <div className="profile-detail-value readonly-value">
                  {user.role}
                </div>

              </div>

              {/* DEPARTMENT */}

              <div className="profile-detail">

                <label>
                  Department
                </label>

                <div className="profile-detail-value readonly-value">
                  {user.department}
                </div>

              </div>

              {/* ACCOUNT STATUS */}

              <div className="profile-detail">

                <label>
                  Account Status
                </label>

                <div className="profile-detail-value profile-status-value">

                  <span className="profile-small-dot"></span>

                  {user.accountStatus}

                </div>

              </div>

              {/* ACCESS LEVEL */}

              <div className="profile-detail">

                <label>
                  Access Level
                </label>

                <div className="profile-detail-value readonly-value">
                  {user.accessLevel}
                </div>

              </div>

              {/* ACCOUNT TYPE */}

              <div className="profile-detail">

                <label>
                  Account Type
                </label>

                <div className="profile-detail-value readonly-value">
                  {user.accountType}
                </div>

              </div>

              {/* PLATFORM */}

              <div className="profile-detail">

                <label>
                  Platform
                </label>

                <div className="profile-detail-value readonly-value">
                  VisionInspectAI
                </div>

              </div>

            </div>

          </div>

          {/* ==================================================
              SUPERVISOR ACCESS
              ================================================== */}

          <div className="profile-section">

            <div className="profile-section-heading">

              <span>
                SUPERVISOR ACCESS
              </span>

              <h3>
                Responsibilities
              </h3>

            </div>

            <div className="profile-access-grid">

              <div className="profile-access-card">

                <div className="profile-access-icon">
                  ✓
                </div>

                <div>

                  <strong>
                    Inspection Monitoring
                  </strong>

                  <p>
                    Monitor completed product
                    inspections and quality decisions.
                  </p>

                </div>

              </div>

              <div className="profile-access-card">

                <div className="profile-access-icon">
                  📊
                </div>

                <div>

                  <strong>
                    Defect Analysis
                  </strong>

                  <p>
                    Review defect classifications,
                    defect levels and severity.
                  </p>

                </div>

              </div>

              <div className="profile-access-card">

                <div className="profile-access-icon">
                  📄
                </div>

                <div>

                  <strong>
                    Production Quality Reports
                  </strong>

                  <p>
                    Monitor production-quality
                    information from inspections.
                  </p>

                </div>

              </div>

              <div className="profile-access-card">

                <div className="profile-access-icon">
                  📈
                </div>

                <div>

                  <strong>
                    Weekly Analytics
                  </strong>

                  <p>
                    Monitor weekly inspection
                    activity and defect trends.
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* ==================================================
              SECURITY
              ================================================== */}

          <div className="profile-security-section">

            <div className="security-icon">
              🔒
            </div>

            <div>

              <span>
                ACCOUNT SECURITY
              </span>

              <h3>
                Supervisor account protected
              </h3>

              <p>
                This profile is associated with the
                Factory Supervisor role and provides
                access to production monitoring features.
              </p>

            </div>

          </div>

          {/* ==================================================
              ACTIONS
              ================================================== */}

          <div className="profile-actions">

            {isEditing ? (
              <>
                <button
                  type="button"
                  className="profile-save-button"
                  onClick={handleSave}
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                className="profile-edit-button"
                onClick={handleEdit}
              >
                Edit Profile
              </button>
            )}

          </div>

        </section>

        {/* ====================================================
            FOOTER
            ==================================================== */}

        <footer className="supervisor-profile-footer">

          <div>

            <strong>
              VisionInspectAI
            </strong>

            <span>
              Smart Manufacturing Quality
              Inspection System
            </span>

          </div>

          <span>
            Factory Supervisor Profile
          </span>

        </footer>

      </main>

    </div>
  );
}

export default SupervisorProfile;