import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const registerUser = async (e) => {
    e.preventDefault();

    // Validate fields
    if (!fullName.trim() || !email.trim() || !password.trim() || !role) {
      alert("Please enter your name, email, password and select your role.");
      return;
    }

    setLoading(true);

    try {
      // Send registration data to backend
      const response = await api.post("/auth/register", {
        full_name: fullName.trim(),
        email: email.trim(),
        password: password,
        role: role,
      });

      console.log("REGISTER RESPONSE:", response.data);

      alert("Account created successfully! Please login.");

      // IMPORTANT:
      // Do NOT go to dashboard after registration.
      // Go to login page.
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Registration Error:", error);

      if (error.response) {
        console.log("STATUS:", error.response.status);
        console.log("BACKEND ERROR:", error.response.data);

        let message = "Registration failed.";

        if (typeof error.response.data?.detail === "string") {
          message = error.response.data.detail;
        } else if (error.response.data?.message) {
          message = error.response.data.message;
        } else {
          message =
            "Registration failed:\n\n" +
            JSON.stringify(error.response.data, null, 2);
        }

        alert(message);
      } else {
        alert("Cannot connect to backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">

        {/* =====================================================
            LEFT SIDE
        ====================================================== */}
        <div className="register-left">

          <div className="brand-icon">🔍</div>

          <h1>VisionInspectAI</h1>

          <h2>
            Smart Manufacturing
            <br />
            Quality Inspection
          </h2>

          <p>
            Create your account and access AI-powered visual inspection,
            quality monitoring and production analytics.
          </p>

          <div className="register-features">
            <p>✓ Automated Defect Detection</p>
            <p>✓ Quality Monitoring</p>
            <p>✓ Production Analytics</p>
          </div>

        </div>

        {/* =====================================================
            RIGHT SIDE
        ====================================================== */}
        <div className="register-card">

          <div className="register-kicker">
            CREATE YOUR ACCOUNT
          </div>

          <h2>Create Account</h2>

          <p className="register-subtitle">
            Enter your details to create your inspection account
          </p>

          <form onSubmit={registerUser}>

            {/* FULL NAME */}
            <label htmlFor="fullName">
              Full Name
            </label>

            <input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />

            {/* EMAIL */}
            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            {/* PASSWORD */}
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />

            {/* ROLE */}
            <label htmlFor="role">
              Select Role
            </label>

            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">
                Select your role
              </option>

              <option value="Quality Engineer">
                Quality Engineer
              </option>

              <option value="Factory Supervisor">
                Factory Supervisor
              </option>
            </select>

            {/* CREATE ACCOUNT BUTTON */}
            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </form>

          {/* LOGIN LINK */}
          <p className="login-link">
            Already have an account?{" "}
            <Link to="/login">
              Sign In
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
}

export default Register;