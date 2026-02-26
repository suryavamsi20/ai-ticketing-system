import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/theme.css";
import "./Footer.css";

const productLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/create-ticket", label: "Create Ticket" },
  { to: "/history", label: "Ticket History" },
  { to: "/about", label: "About" },
];

const accountLinks = [
  { to: "/profile", label: "Profile" },
  { to: "/settings", label: "Settings" },
  { to: "/login", label: "Login" },
];

export default function Footer() {
  const [showLogoRobo, setShowLogoRobo] = useState(true);

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <section className="site-footer__brand">
          <div className="site-footer__logo-row">
            <span className="site-footer__logo-mark" aria-hidden="true">
              {showLogoRobo ? (
                <img
                  src="/logorobo.png"
                  alt=""
                  className="site-footer__logo-robo"
                  onError={() => setShowLogoRobo(false)}
                />
              ) : (
                "ZT"
              )}
            </span>
            <div>
              <h3>Zenticket</h3>
              <p className="text-muted">Support Workspace</p>
            </div>
          </div>
          <p className="site-footer__summary">
            Smart ticket intake, ML-based triage, and streamlined support operations from a single workspace.
          </p>
        </section>

        <nav className="site-footer__nav" aria-label="Footer">
          <div>
            <h4>Product</h4>
            <ul>
              {productLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Account</h4>
            <ul>
              {accountLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="site-footer__bottom">
        <p>Zenticket</p>
        <p>Built with FastAPI, React, and Scikit-learn.</p>
      </div>
    </footer>
  );
}
