import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import API from "../styles/api";
import { getPasswordChecks, isStrongPassword } from "../utils/passwordStrength";
import "../styles/theme.css";

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    department: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const passwordChecks = getPasswordChecks(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    if (!isStrongPassword(formData.password)) {
      setError("Use a stronger password that satisfies all rules.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await API.post("/signup", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      const { data } = await API.post("/login", {
        email: formData.email,
        password: formData.password,
      });
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card wide auth-match-card">
        <div>
          <p className="hero-tag">User Registration</p>
          <h2 className="auth-match-title">Create Your Account</h2>
          <p className="auth-match-subtitle">Fill in user details to onboard into the Zenticket platform.</p>
        </div>

        <form onSubmit={handleSignup} className="auth-form-grid two-col auth-match-form">
          <label>Full Name</label>
          <input name="fullName" type="text" placeholder="Surya Vamsi" value={formData.fullName} onChange={handleChange} required />

          <label>Username</label>
          <input name="username" type="text" placeholder="surya.v" value={formData.username} onChange={handleChange} required />

          <label>Email</label>
          <input name="email" type="email" placeholder="you@company.com" value={formData.email} onChange={handleChange} required />

          <label>Phone</label>
          <input name="phone" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} required />

          <label>Department</label>
          <input name="department" type="text" placeholder="Engineering / Support / HR" value={formData.department} onChange={handleChange} required />

          <label>Password</label>
          <input name="password" type="password" placeholder="Create a password" value={formData.password} onChange={handleChange} required />
          <div className="password-checklist">
            <span className={passwordChecks.length ? "ok" : ""}>At least 10 characters</span>
            <span className={passwordChecks.upper ? "ok" : ""}>One uppercase letter</span>
            <span className={passwordChecks.lower ? "ok" : ""}>One lowercase letter</span>
            <span className={passwordChecks.digit ? "ok" : ""}>One number</span>
            <span className={passwordChecks.special ? "ok" : ""}>One special character</span>
          </div>

          <label>Confirm Password</label>
          <input name="confirmPassword" type="password" placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange} required />

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="primary-btn auth-match-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="auth-links auth-match-links">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
