import React, { useContext, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { AuthContext } from "../AuthContext";
import API from "../styles/api";
import "../styles/theme.css";
import "./Profile.css";

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(user?.user || null);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/me")
      .then((res) => setProfile(res.data))
      .catch(() => {
        if (!user?.user) {
          setError("Could not load profile details.");
        }
      });
  }, [user]);

  const displayName = profile?.username || user?.user?.username || "-";
  const displayEmail = profile?.email || user?.user?.email || "-";
  const displayRole = profile?.role || user?.user?.role || "user";
  const displayId = profile?.id ?? user?.user?.id ?? "-";

  return (
    <>
      <Navbar />
      <div className="profile-container card">
        <h2>Your Profile</h2>
        {error && <p className="error-text">{error}</p>}
        <div className="profile-details">
          <p><strong>User ID:</strong> {displayId}</p>
          <p><strong>Username:</strong> {displayName}</p>
          <p><strong>Email:</strong> {displayEmail}</p>
          <p><strong>Role:</strong> {displayRole}</p>
        </div>
      </div>
      <Footer />
    </>
  );
}
