import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getInspections } from "../utils/inspectionStorage";

function Profile() {
  const navigate = useNavigate();

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const currentUser = getUser();

  const [name, setName] = useState(
    currentUser.name || currentUser.full_name || "B.Sravani"
  );

  const [email, setEmail] = useState(
    currentUser.email || ""
  );

  const role =
    currentUser.role || "Quality Engineer";

  const [inspections, setInspections] = useState([]);

  const [showPasswordSection, setShowPasswordSection] =
    useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [isChangingPassword, setIsChangingPassword] =
    useState(false);

  // --------------------------------------------------
  // LOAD REAL INSPECTION DATA
  // --------------------------------------------------

  useEffect(() => {
    try {
      const data = getInspections();
      setInspections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Unable to load inspection data:",
        error
      );

      setInspections([]);
    }
  }, []);

  // --------------------------------------------------
  // DYNAMIC INSPECTION SUMMARY
  // --------------------------------------------------

  const getDecision = (item) => {
    return String(
      item?.qualityDecision ||
        item?.quality_decision ||
        item?.decision ||
        ""
    )
      .trim()
      .toUpperCase();
  };

  const isPassed = (item) => {
    const decision = getDecision(item);

    return (
      decision === "PASS" ||
      decision === "PASSED"
    );
  };

  const isReview = (item) => {
    return getDecision(item) === "REVIEW";
  };

  const isDefective = (item) => {
    const decision = getDecision(item);

    // Review and Pass must never be counted as defective
    if (isPassed(item) || isReview(item)) {
      return false;
    }

    return true;
  };

  const totalInspections = inspections.length;

  const passedCount = inspections.filter(
    (item) => isPassed(item)
  ).length;

  const reviewCount = inspections.filter(
    (item) => isReview(item)
  ).length;

  const defectiveCount = inspections.filter(
    (item) => isDefective(item)
  ).length;

  // --------------------------------------------------
  // SAVE PROFILE
  // --------------------------------------------------

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      alert("Please enter your name.");
      return;
    }

    if (!trimmedEmail) {
      alert("Please enter your email.");
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: trimmedName,
      email: trimmedEmail,
      role: role,
    };

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    alert("Profile updated successfully!");

    navigate("/dashboard");
  };

  // --------------------------------------------------
  // CHANGE PASSWORD
  // --------------------------------------------------

  const handlePasswordChange = async () => {
    // Validate current password
    if (!currentPassword.trim()) {
      alert("Please enter your current password.");
      return;
    }

    // Validate new password
    if (!newPassword.trim()) {
      alert("Please enter a new password.");
      return;
    }

    // Minimum password length
    if (newPassword.length < 6) {
      alert(
        "New password must contain at least 6 characters."
      );
      return;
    }

    // Confirm password
    if (!confirmPassword.trim()) {
      alert("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    // Prevent same password
    if (currentPassword === newPassword) {
      alert(
        "New password must be different from your current password."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert(
        "Your session has expired. Please login again."
      );

      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setIsChangingPassword(true);

      const response = await fetch(
        "http://127.0.0.1:8000/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to change password."
        );
      }

      alert(
        data.message ||
          "Password changed successfully!"
      );

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Close password section
      setShowPasswordSection(false);
    } catch (error) {
      console.error(
        "Password change error:",
        error
      );

      alert(
        error.message ||
          "Unable to change password. Please try again."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  // --------------------------------------------------
  // REFRESH INSPECTIONS
  // --------------------------------------------------

  const handleRefresh = () => {
    try {
      const data = getInspections();

      setInspections(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Unable to refresh inspections:",
        error
      );

      alert(
        "Unable to refresh inspection data."
      );
    }
  };

  // --------------------------------------------------
  // TOGGLE PASSWORD SECTION
  // --------------------------------------------------

  const handleTogglePasswordSection = () => {
    setShowPasswordSection(
      !showPasswordSection
    );

    // Clear password fields when opening/closing
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: "calc(100vh - 70px)",
          background: "#111827",
          padding: "40px 24px",
          color: "#F8FAFC",
        }}
      >
        <div
          style={{
            maxWidth: "1050px",
            margin: "0 auto",
          }}
        >
          {/* PAGE HEADER */}

          <div style={{ marginBottom: "28px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: "700",
                color: "#F8FAFC",
              }}
            >
              My Profile
            </h1>

            <p
              style={{
                marginTop: "8px",
                marginBottom: 0,
                color: "#94A3B8",
                fontSize: "15px",
              }}
            >
              Manage your Quality Engineer profile
              information and inspection activity.
            </p>
          </div>

          {/* PROFILE + ACCOUNT */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1.35fr) minmax(280px, 0.65fr)",
              gap: "22px",
              marginBottom: "22px",
            }}
          >
            {/* PROFILE CARD */}

            <div
              style={{
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "14px",
                padding: "28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                  marginBottom: "28px",
                }}
              >
                <div
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    background: "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  {name
                    .trim()
                    .charAt(0)
                    .toUpperCase() || "U"}
                </div>

                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#F8FAFC",
                      fontSize: "22px",
                    }}
                  >
                    {name || "Quality Engineer"}
                  </h2>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#94A3B8",
                    }}
                  >
                    {email || "No email available"}
                  </p>
                </div>
              </div>

              {/* NAME */}

              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#F8FAFC",
                }}
              >
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "13px",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  boxSizing: "border-box",
                  background: "#0F172A",
                  color: "#F8FAFC",
                  outline: "none",
                }}
              />

              {/* EMAIL */}

              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#F8FAFC",
                }}
              >
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "13px",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  boxSizing: "border-box",
                  background: "#0F172A",
                  color: "#F8FAFC",
                  outline: "none",
                }}
              />

              {/* ROLE */}

              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#F8FAFC",
                }}
              >
                Role
              </label>

              <input
                type="text"
                value={role}
                disabled
                style={{
                  width: "100%",
                  padding: "13px",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  marginBottom: "25px",
                  boxSizing: "border-box",
                  background: "#273449",
                  color: "#94A3B8",
                }}
              />

              {/* BUTTONS */}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    background: "#2563EB",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "12px 22px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/dashboard")
                  }
                  style={{
                    background: "#334155",
                    color: "#F8FAFC",
                    border: "none",
                    padding: "12px 22px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* ACCOUNT INFORMATION */}

            <div
              style={{
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "14px",
                padding: "28px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "22px",
                  fontSize: "20px",
                  color: "#F8FAFC",
                }}
              >
                Account Information
              </h2>

              <div
                style={{
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: "#94A3B8",
                    fontSize: "13px",
                    marginBottom: "6px",
                  }}
                >
                  Account Status
                </span>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    color: "#22C55E",
                    fontWeight: "600",
                  }}
                >
                  <span>●</span>
                  Active
                </span>
              </div>

              <div
                style={{
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: "#94A3B8",
                    fontSize: "13px",
                    marginBottom: "6px",
                  }}
                >
                  Role
                </span>

                <span
                  style={{
                    color: "#F8FAFC",
                    fontWeight: "600",
                  }}
                >
                  {role}
                </span>
              </div>

              <div>
                <span
                  style={{
                    display: "block",
                    color: "#94A3B8",
                    fontSize: "13px",
                    marginBottom: "6px",
                  }}
                >
                  Registered Email
                </span>

                <span
                  style={{
                    color: "#F8FAFC",
                    wordBreak: "break-word",
                  }}
                >
                  {email || "Not available"}
                </span>
              </div>

              {/* CHANGE PASSWORD */}

              <div
                style={{
                  borderTop: "1px solid #334155",
                  marginTop: "25px",
                  paddingTop: "22px",
                }}
              >
                <button
                  type="button"
                  onClick={
                    handleTogglePasswordSection
                  }
                  style={{
                    width: "100%",
                    background: "#273449",
                    color: "#F8FAFC",
                    border: "1px solid #475569",
                    padding: "11px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  🔒{" "}
                  {showPasswordSection
                    ? "Close Password Change"
                    : "Change Password"}
                </button>
              </div>
            </div>
          </div>

          {/* CHANGE PASSWORD SECTION */}

          {showPasswordSection && (
            <div
              style={{
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "14px",
                padding: "28px",
                marginBottom: "22px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "8px",
                  color: "#F8FAFC",
                  fontSize: "20px",
                }}
              >
                Change Password
              </h2>

              <p
                style={{
                  color: "#94A3B8",
                  marginTop: 0,
                  marginBottom: "22px",
                }}
              >
                Enter your current password and choose
                a new password.
              </p>

              <div
                style={{
                  maxWidth: "500px",
                }}
              >
                {/* CURRENT PASSWORD */}

                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#F8FAFC",
                  }}
                >
                  Current Password
                </label>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    padding: "13px",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                    marginBottom: "18px",
                    boxSizing: "border-box",
                    background: "#0F172A",
                    color: "#F8FAFC",
                    outline: "none",
                  }}
                />

                {/* NEW PASSWORD */}

                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#F8FAFC",
                  }}
                >
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  style={{
                    width: "100%",
                    padding: "13px",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                    marginBottom: "18px",
                    boxSizing: "border-box",
                    background: "#0F172A",
                    color: "#F8FAFC",
                    outline: "none",
                  }}
                />

                {/* CONFIRM PASSWORD */}

                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#F8FAFC",
                  }}
                >
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  style={{
                    width: "100%",
                    padding: "13px",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    boxSizing: "border-box",
                    background: "#0F172A",
                    color: "#F8FAFC",
                    outline: "none",
                  }}
                />

                {/* UPDATE PASSWORD */}

                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                  style={{
                    background: isChangingPassword
                      ? "#475569"
                      : "#2563EB",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "12px 22px",
                    borderRadius: "8px",
                    cursor: isChangingPassword
                      ? "not-allowed"
                      : "pointer",
                    fontWeight: "600",
                  }}
                >
                  {isChangingPassword
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </div>
            </div>
          )}

          {/* INSPECTION SUMMARY */}

          <div
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "14px",
              padding: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                flexWrap: "wrap",
                marginBottom: "22px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    color: "#F8FAFC",
                  }}
                >
                  Inspection Summary
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#94A3B8",
                    fontSize: "14px",
                  }}
                >
                  Based on your current inspection
                  records.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                style={{
                  background: "#273449",
                  color: "#38BDF8",
                  border: "1px solid #475569",
                  padding: "9px 15px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                ↻ Refresh
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, minmax(0, 1fr))",
                gap: "15px",
              }}
            >
              {/* TOTAL */}

              <div
                style={{
                  background: "#273449",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    color: "#94A3B8",
                    fontSize: "13px",
                    marginBottom: "8px",
                  }}
                >
                  Total Inspections
                </div>

                <div
                  style={{
                    color: "#F8FAFC",
                    fontSize: "28px",
                    fontWeight: "700",
                  }}
                >
                  {totalInspections}
                </div>
              </div>

              {/* PASSED */}

              <div
                style={{
                  background: "#273449",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    color: "#94A3B8",
                    fontSize: "13px",
                    marginBottom: "8px",
                  }}
                >
                  Passed
                </div>

                <div
                  style={{
                    color: "#22C55E",
                    fontSize: "28px",
                    fontWeight: "700",
                  }}
                >
                  {passedCount}
                </div>
              </div>

              {/* REVIEW */}

              <div
                style={{
                  background: "#273449",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    color: "#94A3B8",
                    fontSize: "13px",
                    marginBottom: "8px",
                  }}
                >
                  Review
                </div>

                <div
                  style={{
                    color: "#F59E0B",
                    fontSize: "28px",
                    fontWeight: "700",
                  }}
                >
                  {reviewCount}
                </div>
              </div>

              {/* DEFECTIVE */}

              <div
                style={{
                  background: "#273449",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    color: "#94A3B8",
                    fontSize: "13px",
                    marginBottom: "8px",
                  }}
                >
                  Defective
                </div>

                <div
                  style={{
                    color: "#EF4444",
                    fontSize: "28px",
                    fontWeight: "700",
                  }}
                >
                  {defectiveCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default Profile;