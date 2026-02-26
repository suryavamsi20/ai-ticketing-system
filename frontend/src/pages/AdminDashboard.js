import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import API from "../styles/api";
import "../styles/theme.css";

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved"];

function normalizeStatus(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "in progress" || text === "progress") return "In Progress";
  if (text === "resolved" || text === "closed") return "Resolved";
  return "Open";
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusById, setStatusById] = useState({});
  const [commentById, setCommentById] = useState({});
  const [busyTicketId, setBusyTicketId] = useState(null);
  const { user } = useContext(AuthContext);

  const admin = {
    name: user?.user?.username || "Admin",
    email: user?.user?.email || "-",
    adminId: user?.user?.id ? `ADM-${String(user.user.id).padStart(4, "0")}` : "-",
    role: "Support Administrator",
    region: "US Central",
  };

  useEffect(() => {
    API.get("/tickets")
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        setTickets(rows);
        setStatusById(
          rows.reduce((acc, ticket) => ({ ...acc, [ticket.id]: normalizeStatus(ticket.status) }), {})
        );
        setCommentById(
          rows.reduce((acc, ticket) => ({ ...acc, [ticket.id]: ticket.admin_comment || "" }), {})
        );
      })
      .catch((err) => {
        setError(err.response?.data?.detail || err.message || "Unable to fetch ticket data");
      })
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "Open").length;
    const resolved = tickets.filter((t) => t.status === "Resolved").length;
    const high = tickets.filter((t) => String(t.priority).toLowerCase() === "high").length;
    const medium = tickets.filter((t) => String(t.priority).toLowerCase() === "medium").length;
    const low = tickets.filter((t) => String(t.priority).toLowerCase() === "low").length;

    return { total, open, resolved, high, medium, low };
  }, [tickets]);

  const maxPriority = Math.max(metrics.high, metrics.medium, metrics.low, 1);

  const handleUpdateTicket = async (ticketId) => {
    setBusyTicketId(ticketId);
    setError("");
    try {
      const payload = {
        status: statusById[ticketId] || "Open",
        comment: commentById[ticketId] || "",
      };
      const { data } = await API.patch(`/tickets/${ticketId}`, payload);
      setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? data : ticket)));
      setStatusById((prev) => ({ ...prev, [ticketId]: normalizeStatus(data.status) }));
      setCommentById((prev) => ({ ...prev, [ticketId]: data.admin_comment || "" }));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update ticket status");
    } finally {
      setBusyTicketId(null);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    setBusyTicketId(ticketId);
    setError("");
    try {
      await API.delete(`/tickets/${ticketId}`);
      setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete ticket");
    } finally {
      setBusyTicketId(null);
    }
  };

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <div>
          <p className="hero-tag">Admin Control Center</p>
          <h1>Analytics Dashboard</h1>
        </div>
        <div className="admin-nav-links">
          <Link to="/">Home</Link>
          <Link to="/admin-login">Switch Admin</Link>
        </div>
      </header>

      <section className="admin-profile-card">
        <h3>Admin Details</h3>
        <div className="profile-grid">
          <p><strong>Name:</strong> {admin.name}</p>
          <p><strong>Email:</strong> {admin.email}</p>
          <p><strong>Admin ID:</strong> {admin.adminId}</p>
          <p><strong>Role:</strong> {admin.role}</p>
          <p><strong>Region:</strong> {admin.region}</p>
        </div>
      </section>

      <section className="analytics-grid">
        <article className="stat-card"><h3>Total Tickets</h3><p>{metrics.total}</p></article>
        <article className="stat-card"><h3>Open Tickets</h3><p>{metrics.open}</p></article>
        <article className="stat-card"><h3>Resolved</h3><p>{metrics.resolved}</p></article>
        <article className="stat-card"><h3>High Priority</h3><p>{metrics.high}</p></article>
      </section>

      <section className="admin-panels">
        <div className="panel-card">
          <h3>Priority Distribution</h3>
          <div className="chart-row">
            <span>High</span>
            <div className="bar"><i style={{ width: `${(metrics.high / maxPriority) * 100}%` }} /></div>
            <strong>{metrics.high}</strong>
          </div>
          <div className="chart-row">
            <span>Medium</span>
            <div className="bar"><i style={{ width: `${(metrics.medium / maxPriority) * 100}%` }} /></div>
            <strong>{metrics.medium}</strong>
          </div>
          <div className="chart-row">
            <span>Low</span>
            <div className="bar"><i style={{ width: `${(metrics.low / maxPriority) * 100}%` }} /></div>
            <strong>{metrics.low}</strong>
          </div>
        </div>

        <div className="panel-card">
          <h3>Recent Tickets</h3>
          {loading && <p className="muted-text">Loading tickets...</p>}
          {error && <p className="error-text">{error}</p>}
          {!loading && !error && (
            <div className="ticket-table-wrap">
              <table className="ticket-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.slice(0, 6).map((ticket) => (
                    <tr key={ticket.id}>
                      <td>#{ticket.id}</td>
                      <td>{ticket.category}</td>
                      <td>{ticket.priority}</td>
                      <td>{ticket.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="panel-card admin-ticket-management">
        <h3>Ticket Actions</h3>
        {tickets.length === 0 && !loading && !error && <p className="muted-text">No tickets available.</p>}
        <div className="admin-ticket-grid">
          {tickets.slice(0, 8).map((ticket) => (
            <article className="admin-ticket-card" key={ticket.id}>
              <div className="admin-ticket-meta-row">
                <p><strong>Status:</strong> <span className={`admin-badge admin-badge-status-${normalizeStatus(ticket.status).toLowerCase().replace(/\s+/g, "-")}`}>{normalizeStatus(ticket.status)}</span></p>
                <p><strong>Priority:</strong> <span className={`admin-badge admin-badge-priority-${String(ticket.priority).toLowerCase()}`}>{ticket.priority}</span></p>
                <p><strong>Category:</strong> {ticket.category}</p>
                <p><strong>Created:</strong> {ticket.created_at ? new Date(ticket.created_at).toISOString().slice(0, 10) : "-"}</p>
              </div>
              <p className="admin-ticket-description"><strong>Description:</strong> {ticket.description}</p>
              {ticket.admin_comment && <p className="admin-ticket-description"><strong>Admin Comment:</strong> {ticket.admin_comment}</p>}

              <div className="admin-ticket-inline-actions">
                <select
                  id={`status-${ticket.id}`}
                  className="admin-control admin-inline-status"
                  value={statusById[ticket.id] || "Open"}
                  onChange={(e) => setStatusById((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>

                <input
                  id={`comment-${ticket.id}`}
                  type="text"
                  className="admin-control admin-inline-comment"
                  value={commentById[ticket.id] || ""}
                  onChange={(e) => setCommentById((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                  placeholder="Add admin comment..."
                />

                <button
                  type="button"
                  className="secondary-btn admin-action-btn admin-inline-save"
                  disabled={busyTicketId === ticket.id}
                  onClick={() => handleUpdateTicket(ticket.id)}
                >
                  Save
                </button>

                <button
                  type="button"
                  className="secondary-btn admin-delete-btn admin-inline-delete"
                  disabled={busyTicketId === ticket.id}
                  onClick={() => handleDeleteTicket(ticket.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
