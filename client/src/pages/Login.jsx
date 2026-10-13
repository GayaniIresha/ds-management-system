
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, User, Lock } from "lucide-react";
import "../Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save login information
      localStorage.setItem("dsmsToken", data.token);
      localStorage.setItem("dsmsUser", JSON.stringify(data.user));

      // Redirect according to the user's role
      const role = String(data.user?.role || "").toLowerCase();

      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "officer") {
        navigate("/officer/dashboard", { replace: true });
      } else if (role === "citizen") {
        navigate("/citizen/dashboard", { replace: true });
      } else {
        localStorage.removeItem("dsmsToken");
        localStorage.removeItem("dsmsUser");
        setMessage("Unknown user role. Please contact the administrator.");
      }
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the server. Please check the backend."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <ShieldCheck size={38} />
        </div>

        <h1>DSMS</h1>

        <p className="login-subtitle">
          Divisional Secretariat Management System
        </p>

        <div className="login-heading">
          <h2>Welcome Back</h2>
          <p>Sign in to access your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email Address</label>

          <div className="login-input">
            <User size={18} />
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="password">Password</label>

          <div className="login-input">
            <Lock size={18} />
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {message && (
            <p role="alert" className="login-error">
              {message}
            </p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="register-link">
          Don't have an account?{" "}
          <Link to="/register">Create Account</Link>
        </p>

        <p className="login-footer">
          DSMS Prototype · For demonstration purposes
        </p>
      </div>
    </div>
  );
}

export default Login;
