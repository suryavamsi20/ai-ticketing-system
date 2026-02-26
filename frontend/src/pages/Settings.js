import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/theme.css";
import "./Settings.css";

export default function Settings() {
  return (
    <>
      <Navbar />
      <div className="settings-container">
        <h2>Settings</h2>
        {/* Placeholder options */}
        <p>Notification preferences, theme settings, etc.</p>
      </div>
      <Footer />
    </>
  );
}
