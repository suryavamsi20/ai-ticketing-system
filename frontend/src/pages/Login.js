import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";
import API from "../styles/api";
import "../styles/theme.css";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await API.post("/login", { email, password });
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken) => {
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post("/auth/google-login", { id_token: idToken, as_admin: false });
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Google Sign-In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-premium-page">
      <div className="login-bg-glow login-bg-glow-one" aria-hidden="true" />
      <div className="login-bg-glow login-bg-glow-two" aria-hidden="true" />
      <div className="login-bg-noise" aria-hidden="true" />
      <div className="login-premium-shell">
        <section className="login-premium-card">
          <p className="login-kicker">User Access</p>
          <h2 className="login-heading">Login to Your Support Workspace</h2>
          <p className="login-subheading">Track tickets, raise new requests, and view AI predictions in one place.</p>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="auth-divider"><span>or</span></div>
            <GoogleSignInButton onToken={handleGoogleLogin} disabled={loading} label="Sign in instantly with Google" />
          </form>

          <p className="login-links">
            New user? <Link to="/signup">Create account</Link>
            {" | "}
            <Link to="/forgot-password">Forgot password</Link>
            {" | "}
            <Link to="/admin-login">Admin login</Link>
          </p>
        </section>

        <aside className="login-premium-glow" aria-hidden="true">
          <div className="login-premium-radial" />
          <div className="login-premium-radial-secondary" />
          <div className="login-premium-vignette" />
          <div className="login-premium-content">
            <h3>Smart AI Ticket Automation</h3>
            <p>Powered by Machine Learning</p>
            <ul>
              <li>Auto category detection</li>
              <li>Priority prediction</li>
              <li>Faster response workflow</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
