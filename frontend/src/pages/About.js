import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/theme.css";
import "./About.css";

export default function About() {
  const location = useLocation();
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (location.hash !== "#contact") return;
    const node = document.getElementById("contact");
    if (!node) return;
    // Delay ensures layout is painted before trying to scroll.
    window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location]);

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContact((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setContact({ name: "", email: "", message: "" });
  };

  return (
    <>
      <Navbar />

      <div className="about-wrap">
        <section className="about-hero card">
          <p className="hero-tag">About The Platform</p>
          <h1>Zenticket</h1>
          <p className="muted-text">
            A support workflow platform that uses ML to classify and prioritize incoming issues,
            helping teams respond faster with less manual triage.
          </p>
        </section>

        <section className="about-grid two-col">
          <article className="about-card card">
            <h3>Our Mission</h3>
            <p>
              Reduce manual effort in early ticket processing by converting natural language
              requests into structured tickets with reliable category and priority predictions.
            </p>
          </article>

          <article className="about-card card">
            <h3>Our Vision</h3>
            <p>
              Build intelligent support operations where AI handles repetitive triage so teams
              focus on root-cause analysis, resolution quality, and customer outcomes.
            </p>
          </article>
        </section>

        <section className="about-section card">
          <h2>Project Overview</h2>
          <p>
            The system accepts issue text from users, performs preprocessing, predicts category
            and priority using TF-IDF + LinearSVC models, and stores a structured ticket.
          </p>
          <ul>
            <li>Ticket title generation</li>
            <li>Predicted category (for example Incident, Request, Change)</li>
            <li>Predicted priority (Low, Medium, High)</li>
            <li>Ticket history for tracking and analytics</li>
          </ul>
        </section>

        <section className="about-section card">
          <h2>How It Works</h2>
          <div className="about-grid four-col">
            <article className="about-mini card-secondary">
              <h4>1. User Input</h4>
              <p>Issue details are submitted in natural language.</p>
            </article>
            <article className="about-mini card-secondary">
              <h4>2. Preprocessing</h4>
              <p>Text is normalized and vectorized for inference.</p>
            </article>
            <article className="about-mini card-secondary">
              <h4>3. Prediction</h4>
              <p>ML models infer category and priority.</p>
            </article>
            <article className="about-mini card-secondary">
              <h4>4. Ticket Saved</h4>
              <p>The structured ticket is persisted and shown in history.</p>
            </article>
          </div>
        </section>

        <section id="contact" className="about-contact-grid">
          <article className="about-section card">
            <h2>About Zenticket</h2>
            <p>
              Zenticket helps support teams reduce manual triage work with AI-assisted
              ticket analysis, category prediction, and priority detection.
            </p>
            <p>
              Our platform is designed for fast adoption, clean workflows, and measurable
              response-time improvement across IT/helpdesk operations.
            </p>
          </article>

          <article className="about-section card">
            <h2>Contact Us</h2>
            <form className="about-contact-form" onSubmit={handleContactSubmit}>
              <label>Name</label>
              <input
                name="name"
                type="text"
                placeholder="Your name"
                value={contact.name}
                onChange={handleContactChange}
                required
              />

              <label>Email</label>
              <input
                name="email"
                type="email"
                placeholder="you@company.com"
                value={contact.email}
                onChange={handleContactChange}
                required
              />

              <label>Message</label>
              <textarea
                name="message"
                placeholder="How can we help your support team?"
                value={contact.message}
                onChange={handleContactChange}
                required
              />

              <button type="submit" className="primary-btn">Send Message</button>
              {sent && <p className="about-contact-success">Thanks. We will contact you soon.</p>}
            </form>
          </article>
        </section>
      </div>

      <Footer />
    </>
  );
}

