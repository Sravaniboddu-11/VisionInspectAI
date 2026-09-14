import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const loginUser = async (e) => {
    e.preventDefault();

    if (!email || !password || !role) {
      alert("Please enter email, password and select your role.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password: password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      const user = response.data.user;

      if (!user) {
        alert("Login successful, but user details were not received.");
        return;
      }

      if (user.role !== role) {
        alert(
          `Role mismatch.\n\nThis account is registered as: ${user.role}`
        );
        return;
      }

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(user));

      alert(`Welcome ${user.full_name}!`);

      if (user.role === "Factory Supervisor") {
        navigate("/supervisor");
      } else if (user.role === "Quality Engineer") {
        navigate("/dashboard");
      } else {
        alert("Unknown user role.");
      }
    } catch (error) {
      console.error("Login Error:", error);

      if (error.response) {
        console.log("STATUS:", error.response.status);
        console.log("BACKEND ERROR:", error.response.data);

        const backendMessage =
          error.response.data?.detail ||
          error.response.data?.message ||
          "Login failed.";

        alert(`Login failed:\n\n${backendMessage}`);
      } else if (error.request) {
        console.log("No response received from backend.");
        alert(
          "Cannot connect to backend.\n\nPlease check the backend URL and CORS settings."
        );
      } else {
        alert(`Request error:\n\n${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-left">
          <div className="brand-icon">🔍</div>

          <h1>VisionInspectAI</h1>

          <h2>
            Smart Manufacturing
            <br />
            Quality Inspection
          </h2>

          <p>
            AI-powered visual inspection for reliable and efficient
            manufacturing quality control.
          </p>

          <div className="login-features">
            <p>✓ Automated Defect Detection</p>
            <p>✓ Quality Monitoring</p>
            <p>✓ Production Analytics</p>
          </div>
        </div>

        <div className="login-card">
          <div className="login-kicker">
            QUALITY CONTROL PLATFORM
          </div>

          <h2>Welcome Back</h2>

          <p className="login-subtitle">
            Sign in to access your inspection workspace
          </p>

          <form onSubmit={loginUser}>

            <label htmlFor="email">Email Address</label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="role">Select Role</label>

            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">Select your role</option>
              <option value="Quality Engineer">
                Quality Engineer
              </option>
              <option value="Factory Supervisor">
                Factory Supervisor
              </option>
            </select>

            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="register-link">
            Don't have an account?{" "}
            <Link to="/register">Create Account</Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;