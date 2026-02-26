import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import API from "../styles/api";
import { getPasswordChecks, isStrongPassword } from "../utils/passwordStrength";
import "../styles/theme.css";

export default function AdminSignup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const passwordChecks = getPasswordChecks(password);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    if (!isStrongPassword(password)) {
      setError("Use a stronger password that satisfies all rules.");
      return;
    }

    setLoading(true);
    try {
      await API.post("/admin/signup", {
        username,
        email,
        password,
        admin_code: adminCode,
      });

      const { data } = await API.post("/login", { email, password });
      login(data);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.detail || "Admin signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-match-card">
        <div>
          <p className="hero-tag">Admin Onboarding</p>
          <h2 className="auth-match-title">Create Admin Account</h2>
          <p className="auth-match-subtitle">Create a new administrator account with the admin signup code.</p>
        </div>

        <form onSubmit={handleSignup} className="auth-form-grid auth-match-form">
          <label>Username</label>
          <input
            type="text"
            placeholder="admin.ops"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label>Admin Email</label>
          <input
            type="email"
            placeholder="admin@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Create admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="password-checklist">
            <span className={passwordChecks.length ? "ok" : ""}>At least 10 characters</span>
            <span className={passwordChecks.upper ? "ok" : ""}>One uppercase letter</span>
            <span className={passwordChecks.lower ? "ok" : ""}>One lowercase letter</span>
            <span className={passwordChecks.digit ? "ok" : ""}>One number</span>
            <span className={passwordChecks.special ? "ok" : ""}>One special character</span>
          </div>

          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Repeat admin password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <label>Admin Signup Code</label>
          <input
            type="text"
            placeholder="Enter admin code"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            required
          />

          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="primary-btn auth-match-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Admin Account"}
          </button>
        </form>

        <p className="auth-links auth-match-links">
          Already admin? <Link to="/admin-login">Admin Login</Link>
          {" | "}
          <Link to="/admin-forgot-password">Forgot password</Link>
          {" | "}
          <Link to="/login">User Login</Link>
        </p>
      </div>
    </div>
  );
}
