import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";
import API from "../styles/api";
import "../styles/theme.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await API.post("/login", { email, password });
      if (data?.user?.role !== "admin") {
        setError("This account is not an admin account.");
        setLoading(false);
        return;
      }
      login(data);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.detail || "Admin login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAdminLogin = async (idToken) => {
    setError("");
    setLoading(true);

    try {
      const { data } = await API.post("/auth/google-login", { id_token: idToken, as_admin: true });
      login(data);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.detail || "Google admin login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-match-card">
        <div>
          <p className="hero-tag">Admin Portal</p>
          <h2 className="auth-match-title">Admin Login</h2>
          <p className="auth-match-subtitle">Sign in with admin credentials to access ticket analytics and controls.</p>
        </div>

        <form onSubmit={handleAdminLogin} className="auth-form-grid auth-match-form">
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
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="primary-btn auth-match-btn" disabled={loading}>
            {loading ? "Signing in..." : "Enter Admin Portal"}
          </button>

          <div className="auth-divider"><span>or</span></div>
          <GoogleSignInButton onToken={handleGoogleAdminLogin} disabled={loading} label="Sign in as admin with Google" />
        </form>

        <p className="auth-links auth-match-links">
          <Link to="/login">User Login</Link>
          {" | "}
          <Link to="/admin-signup">Create Admin</Link>
          {" | "}
          <Link to="/admin-forgot-password">Forgot password</Link>
          {" | "}
          <Link to="/">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
