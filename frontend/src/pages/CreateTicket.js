// frontend/src/pages/CreateTicket.js
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../styles/api";
import { trackInteraction } from "../utils/analytics";
import "../styles/theme.css";
import "./CreateTicket.css";

export default function CreateTicket() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    trackInteraction("create_page_views");
  }, []);

  const extractEntities = (text) => {
    if (!text) return [];
    const stopWords = new Set([
      "the", "and", "for", "with", "that", "this", "from", "into", "your",
      "have", "has", "are", "was", "were", "will", "would", "should", "could",
      "about", "issue", "ticket", "support", "user", "please"
    ]);
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));
    return [...new Set(words)].slice(0, 6);
  };

  const getQueueLabel = (category) => {
    const c = String(category || "").toLowerCase();
    if (c.includes("network") || c.includes("server")) return "Infrastructure";
    if (c.includes("access") || c.includes("account")) return "Identity";
    return "IT Support";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setLoading(true);
    setError("");
    try {
      const analysisText = `${subject.trim()}. ${description.trim()}`;
      const { data } = await API.post("/predict-ticket", { text: analysisText });
      trackInteraction("ticket_submits", {
        category: data?.category || null,
        priority: data?.priority || null,
      });
      setResult(data);
      setSubject("");
      setDescription("");
    } catch (e) {
      trackInteraction("ticket_submit_failures");
      const detail = e.response?.data?.detail;
      const fallback = typeof e.response?.data === "string" ? e.response.data : null;
      setError(detail || fallback || e.message || "Ticket creation failed.");
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="create-container">
        <form className="input-section card" onSubmit={handleSubmit}>
          <h2>New Support Ticket</h2>
          <label className="field-label">Subject</label>
          <input
            className="subject-input"
            type="text"
            placeholder="Enter ticket subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <label className="field-label">Description</label>
          <textarea
            placeholder="Describe your issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze & Submit Ticket"}
          </button>
        </form>

        {result && (
          <div className="output-section card-secondary">
            <div className="ticket-analyzed-head">
              <div className="ticket-analyzed-icon">✓</div>
              <div>
                <h3>Ticket Analyzed</h3>
                <p className="ticket-id">#TKT-{String(result.id ?? 0).padStart(5, "0")}</p>
              </div>
            </div>

            <div className="ticket-metrics-grid">
              <div className="metric-card">
                <span>CATEGORY</span>
                <strong className="metric-category">{result.category || "-"}</strong>
              </div>
              <div className="metric-card">
                <span>PRIORITY</span>
                <strong className={`metric-priority priority-${String(result.priority || "").toLowerCase()}`}>
                  {result.priority || "-"}
                </strong>
              </div>
              <div className="metric-card">
                <span>QUEUE</span>
                <strong>{getQueueLabel(result.category)}</strong>
              </div>
              <div className="metric-card">
                <span>STATUS</span>
                <strong className={`metric-status status-${String(result.status || "").toLowerCase()}`}>
                  {result.status || "Pending"}
                </strong>
              </div>
            </div>

            <div className="entities-wrap">
              <h4>EXTRACTED ENTITIES</h4>
              <div className="entities-list">
                {extractEntities(result.description).length === 0 ? (
                  <span className="entity-chip muted">No entities found</span>
                ) : (
                  extractEntities(result.description).map((entity) => (
                    <span key={entity} className="entity-chip">{entity}</span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
