import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../styles/api";
import { getPasswordChecks, isStrongPassword } from "../utils/passwordStrength";
import "../styles/theme.css";

export default function ResetPassword() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const isAdmin = useMemo(() => new URLSearchParams(search).get("admin") === "1", [search]);

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const checks = getPasswordChecks(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setError("Use a stronger password that satisfies all rules.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      setMessage(data?.message || "Password has been reset successfully.");
      setTimeout(() => navigate(isAdmin ? "/admin-login" : "/login"), 900);
    } catch (err) {
      setError(err.response?.data?.detail || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-match-card">
        <div>
          <p className="hero-tag">{isAdmin ? "Admin Reset" : "Password Reset"}</p>
          <h2 className="auth-match-title">Set New Password</h2>
          <p className="auth-match-subtitle">
            Enter your reset token and set a strong password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-grid auth-match-form">
          <label>Reset Token</label>
          <input
            type="text"
            placeholder="Paste reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />

          <label>New Password</label>
          <input
            type="password"
            placeholder="Create new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <div className="password-checklist">
            <span className={checks.length ? "ok" : ""}>At least 10 characters</span>
            <span className={checks.upper ? "ok" : ""}>One uppercase letter</span>
            <span className={checks.lower ? "ok" : ""}>One lowercase letter</span>
            <span className={checks.digit ? "ok" : ""}>One number</span>
            <span className={checks.special ? "ok" : ""}>One special character</span>
          </div>

          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}

          <button type="submit" className="primary-btn auth-match-btn" disabled={loading}>
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <p className="auth-links auth-match-links">
          <Link to={isAdmin ? "/admin-forgot-password" : "/forgot-password"}>Back to Forgot Password</Link>
          {" | "}
          <Link to={isAdmin ? "/admin-login" : "/login"}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
