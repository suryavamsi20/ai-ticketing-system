import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import "../styles/theme.css";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoRobo, setShowLogoRobo] = useState(true);

  const displayName = user?.user?.username || "User";
  const displayEmail = user?.user?.email || "";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => (location.pathname === path ? "active-link" : "");

  return (
    <nav className="topbar">
      <div className="logo-wrap">
        <div className="logo-mark" aria-hidden="true">
          {showLogoRobo ? (
            <img
              src="/logorobo.svg"
              alt=""
              className="logo-project-robo"
              onError={() => setShowLogoRobo(false)}
            />
          ) : (
            <span className="logo-text">ZT</span>
          )}
        </div>
        <div>
          <div className="logo">Zenticket</div>
          <small className="logo-sub">Support Workspace</small>
        </div>
      </div>
      <div className="nav-links">
        <Link className={isActive("/dashboard")} to="/dashboard">Dashboard</Link>
        <Link className={isActive("/create-ticket")} to="/create-ticket">Create Ticket</Link>
        <Link className={isActive("/history")} to="/history">History</Link>
        <Link className={isActive("/about")} to="/about">About</Link>
        <Link to="/about#contact">Contact</Link>
      </div>
      <div className="user-pill">
        <div className="avatar">{initials}</div>
        <div className="user-meta">
          <div className="user-name">{displayName}</div>
          <div className="user-email">{displayEmail}</div>
        </div>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
