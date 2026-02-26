import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import API from "../styles/api";
import { trackInteraction } from "../utils/analytics";
import "../styles/theme.css";
import "./Dashboard.css";

const POLL_INTERVAL_MS = 3000;

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "closed" || value === "resolved") return "closed";
  if (value === "pending" || value === "open") return "open";
  return value || "open";
}

function normalizeLabel(value) {
  const text = String(value || "").trim();
  if (!text) return "Unknown";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getSinceLabel(timestamp) {
  if (!timestamp) return "just now";
  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(diffMs) || diffMs < 60 * 1000) return "just now";
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getPieStyle(segments) {
  const totalValue = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (totalValue <= 0) {
    return { background: "conic-gradient(#e2e8f0 0% 100%)" };
  }
  let cursor = 0;
  const stops = segments
    .map((segment) => {
      const from = cursor;
      cursor += segment.value;
      return `${segment.color} ${from}% ${cursor}%`;
    })
    .join(", ");
  return { background: `conic-gradient(${stops})` };
}

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchTickets = async () => {
      try {
        const res = await API.get("/tickets", { params: { _ts: Date.now() } });
        if (!isMounted) return;
        setTickets(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!isMounted) return;
        setTickets([]);
      } finally {
        if (!isMounted) return;
        setLoading(false);
        setLastSyncAt(new Date().toISOString());
      }
    };

    trackInteraction("dashboard_views");
    fetchTickets();

    const interval = window.setInterval(() => {
      fetchTickets();
    }, POLL_INTERVAL_MS);

    const handleFocus = () => fetchTickets();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchTickets();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => normalizeStatus(t.status) === "open").length;
    const resolved = tickets.filter((t) => normalizeStatus(t.status) === "closed").length;
    const high = tickets.filter((t) => String(t.priority).toLowerCase() === "high").length;

    const last24h = tickets.filter((t) => {
      if (!t.created_at) return false;
      return Date.now() - new Date(t.created_at).getTime() <= 24 * 60 * 60 * 1000;
    }).length;

    return { total, open, resolved, high, last24h };
  }, [tickets]);

  const categoryRows = useMemo(() => {
    const counts = tickets.reduce((acc, ticket) => {
      const key = normalizeLabel(ticket.category);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [tickets]);

  const priorityRows = useMemo(() => {
    const counts = tickets.reduce((acc, ticket) => {
      const key = normalizeLabel(ticket.priority);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [tickets]);

  const maxCategoryCount = Math.max(...categoryRows.map(([, count]) => count), 1);
  const maxPriorityCount = Math.max(...priorityRows.map(([, count]) => count), 1);
  const statusSegments = useMemo(() => {
    const total = stats.total;
    const denom = total || 1;
    const inProgress = Math.max(total - stats.open - stats.resolved, 0);
    return [
      {
        label: "Resolved",
        count: stats.resolved,
        value: (stats.resolved / denom) * 100,
        color: "#16a34a",
      },
      {
        label: "Pending/Open",
        count: stats.open,
        value: (stats.open / denom) * 100,
        color: "#2563eb",
      },
      {
        label: "In Progress",
        count: inProgress,
        value: (inProgress / denom) * 100,
        color: "#f59e0b",
      },
    ];
  }, [stats]);

  return (
    <>
      <Navbar />
      <div className="dashboard-wrap">
        <section className="dashboard-hero">
          <div>
            <p className="hero-tag">Operations Center</p>
            <h1>Support Dashboard</h1>
            <p>Manage AI-created tickets, monitor priorities, and track resolution progress.</p>
            <p className="dashboard-live-meta">
              <span className="live-dot" />
              Live every {Math.floor(POLL_INTERVAL_MS / 1000)}s
              <span className="live-sep">|</span>
              Last sync: {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : "initializing..."}
            </p>
          </div>
          <div className="hero-actions">
            <Link className="primary-btn" to="/create-ticket">Create Ticket</Link>
            <Link className="secondary-btn" to="/history">View History</Link>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <h3>Total Tickets</h3>
            <p>{stats.total}</p>
          </article>
          <article className="stat-card">
            <h3>Open</h3>
            <p>{stats.open}</p>
          </article>
          <article className="stat-card">
            <h3>Resolved</h3>
            <p>{stats.resolved}</p>
          </article>
          <article className="stat-card">
            <h3>High Priority</h3>
            <p>{stats.high}</p>
          </article>
          <article className="stat-card">
            <h3>Raised (24h)</h3>
            <p>{stats.last24h}</p>
          </article>
        </section>

        <section className="recent-card">
          <h3>Recent Tickets</h3>
          {loading ? (
            <p className="muted-text">Loading live ticket stream...</p>
          ) : tickets.length === 0 ? (
            <p className="muted-text">No tickets yet. Create your first ticket to get started.</p>
          ) : (
            <ul className="recent-list">
              {tickets.slice(0, 5).map((ticket) => (
                <li key={ticket.id}>
                  <div>
                    <span className="ticket-title">{ticket.title}</span>
                    <span className="ticket-meta">{ticket.category} | {ticket.priority}</span>
                    {ticket.admin_comment && <span className="ticket-admin-comment">Admin: {ticket.admin_comment}</span>}
                  </div>
                  <span className="ticket-time">{getSinceLabel(ticket.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-insights-grid">
          <article className="recent-card">
            <h3>Ticket Status Breakdown</h3>
            <div className="pie-wrap">
              <div className="pie-chart" style={getPieStyle(statusSegments)} aria-label="Ticket status pie chart" />
              <div className="pie-legend">
                {statusSegments.map((segment) => (
                  <div className="pie-legend-item" key={segment.label}>
                    <span className="dot" style={{ background: segment.color }} />
                    <span>{segment.label}</span>
                    <strong>{segment.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="recent-card">
            <h3>Category Distribution</h3>
            {categoryRows.length === 0 ? (
              <p className="muted-text">No category data yet.</p>
            ) : (
              <div className="distribution-list">
                {categoryRows.map(([label, count]) => (
                  <div className="distribution-row" key={label}>
                    <span>{label}</span>
                    <div className="bar"><i style={{ width: `${(count / maxCategoryCount) * 100}%` }} /></div>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="recent-card">
            <h3>Priority Distribution</h3>
            {priorityRows.length === 0 ? (
              <p className="muted-text">No priority data yet.</p>
            ) : (
              <div className="distribution-list">
                {priorityRows.map(([label, count]) => (
                  <div className="distribution-row" key={label}>
                    <span>{label}</span>
                    <div className="bar"><i style={{ width: `${(count / maxPriorityCount) * 100}%` }} /></div>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

      </div>
      <Footer />
    </>
  );
}
