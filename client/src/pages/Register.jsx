
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, User, Mail, Lock, Phone } from "lucide-react";
import "../Login.css";
import "./Register.css";

function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setMessage("Account created successfully! Please sign in.");

      setFormData({
        full_name: "",
        email: "",
        phone: "",
        password: "",
      });
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the server. Please check that the backend is running."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card register-card">
        <div className="login-logo">
          <ShieldCheck size={38} />
        </div>

        <h1>DSMS</h1>
        <p className="login-subtitle">
          Divisional Secretariat Management System
        </p>

        <div className="login-heading">
          <h2>Create Account</h2>
          <p>Register to access public services</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="fullName">Full Name</label>
          <div className="login-input">
            <User size={18} />
            <input
              id="fullName"
              name="full_name"
              type="text"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <label htmlFor="registerEmail">Email Address</label>
          <div className="login-input">
            <Mail size={18} />
            <input
              id="registerEmail"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <label htmlFor="phone">Phone Number</label>
          <div className="login-input">
            <Phone size={18} />
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <label htmlFor="registerPassword">Password</label>
          <div className="login-input">
            <Lock size={18} />
            <input
              id="registerPassword"
              name="password"
              type="password"
              placeholder="Create a password (8+ characters)"
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {message && (
            <p role="status" aria-live="polite">
              {message}
            </p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="register-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>

        <p className="login-footer">
          DSMS Prototype · For demonstration purposes
        </p>
      </div>
    </div>
  );
}

export default Register;