import React, { useEffect, useMemo, useRef, useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../styles/api";
import { trackInteraction } from "../utils/analytics";
import "./TicketHistory.css";

const POLL_INTERVAL_MS = 3000;

export default function TicketHistory() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const lastTrackedSearch = useRef("");

  useEffect(() => {
    trackInteraction("history_views");
    let isMounted = true;

    const fetchTickets = () => {
      API.get("/tickets", { params: { _ts: Date.now() } })
        .then((res) => {
          if (!isMounted) return;
          setTickets(Array.isArray(res.data) ? res.data : []);
        })
        .catch((err) => console.error("Error fetching tickets:", err));
    };

    fetchTickets();
    const interval = window.setInterval(fetchTickets, POLL_INTERVAL_MS);
    const handleFocus = () => fetchTickets();
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    const term = search.trim().toLowerCase();
    if (term.length < 2 || term === lastTrackedSearch.current) return;
    const timeout = setTimeout(() => {
      trackInteraction("history_searches", { term_length: term.length });
      lastTrackedSearch.current = term;
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const filteredTickets = useMemo(() => {
    const term = search.toLowerCase();
    return tickets.filter(
      (t) =>
        t.title?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.category?.toLowerCase().includes(term) ||
        t.admin_comment?.toLowerCase().includes(term)
    );
  }, [tickets, search]);

  const exportToExcel = async () => {
    trackInteraction("history_exports", { row_count: filteredTickets.length });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tickets");
    worksheet.columns = [
      { header: "Ticket ID", key: "id", width: 12 },
      { header: "Title", key: "title", width: 32 },
      { header: "Category", key: "category", width: 18 },
      { header: "Priority", key: "priority", width: 16 },
      { header: "Status", key: "status", width: 14 },
      { header: "Admin Comment", key: "admin_comment", width: 34 },
      { header: "Created", key: "created_at", width: 22 },
    ];

    filteredTickets.forEach((ticket) => worksheet.addRow(ticket));
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "ticket-history.xlsx");
  };

  return (
    <>
      <Navbar />
      <div className="history-wrap">
        <section className="history-head">
          <h1>Ticket History</h1>
          <div className="history-tools">
            <input
              type="text"
              placeholder="Search by title, category, or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="export-btn" type="button" onClick={exportToExcel}>
              Export
            </button>
          </div>
        </section>

        <section className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Admin Comment</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">No tickets found</td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>
                      <div className="subject-main">{t.title}</div>
                      <div className="subject-sub">{t.description}</div>
                    </td>
                    <td>{t.category}</td>
                    <td><span className={`pill priority-${String(t.priority).toLowerCase()}`}>{t.priority}</span></td>
                    <td><span className={`pill status-${String(t.status).toLowerCase().replace(/\s+/g, "-")}`}>{t.status}</span></td>
                    <td className="admin-comment-cell">{t.admin_comment || "-"}</td>
                    <td>{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
      <Footer />
    </>
  );
}
