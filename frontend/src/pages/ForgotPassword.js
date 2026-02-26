import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../styles/api";
import "../styles/theme.css";

export default function ForgotPassword({ isAdmin = false }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);

  const loginPath = isAdmin ? "/admin-login" : "/login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetToken("");
    setLoading(true);

    try {
      const { data } = await API.post("/auth/forgot-password", { email });
      setMessage(data?.message || "If the account exists, a reset link has been generated.");
      if (data?.reset_token_for_dev) {
        setResetToken(data.reset_token_for_dev);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to process forgot password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-match-card">
        <div>
          <p className="hero-tag">{isAdmin ? "Admin Recovery" : "Account Recovery"}</p>
          <h2 className="auth-match-title">Forgot Password</h2>
          <p className="auth-match-subtitle">
            Enter your registered email to generate a password reset token.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-grid auth-match-form">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p className="error-text">{error}</p>}
          {message && <p className="text-muted">{message}</p>}
          {resetToken && (
            <div className="reset-token-box">
              <strong>Dev reset token:</strong> <code>{resetToken}</code>
            </div>
          )}

          <button type="submit" className="primary-btn auth-match-btn" disabled={loading}>
            {loading ? "Generating..." : "Generate Reset Token"}
          </button>
        </form>

        <p className="auth-links auth-match-links">
          <Link to={`/reset-password${isAdmin ? "?admin=1" : ""}`}>Go to Reset Password</Link>
          {" | "}
          <Link to={loginPath}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
