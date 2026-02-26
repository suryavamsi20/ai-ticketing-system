import React from "react";
import { Link } from "react-router-dom";
import "../styles/theme.css";

export default function Landing() {
  return (
    <div className="page-shell">
      <div className="bg-orb orb-one" />
      <div className="bg-orb orb-two" />
      <div className="bg-orb orb-three" />

      <section className="hero-panel landing-hero">
        <div className="landing-copy">
          <p className="hero-tag">AI Service Desk</p>
          <h1 className="hero-title">Build Your AI Ticketing World Easily</h1>
          <p className="hero-sub">
            Automatically analyze user requests using NLP to generate structured tickets with predicted category and priority while keeping your support process fast, trackable, and reliable.
          </p>

          <div className="hero-buttons">
            <Link to="/signup" className="primary-btn">Get Started</Link>
            <Link to="/login" className="secondary-btn">Login</Link>
            <Link to="/admin-login" className="tertiary-btn">Admin Portal</Link>
          </div>

          <div className="hero-strip">
            <article>
              <strong>92%</strong>
              <span>Category Accuracy</span>
            </article>
            <article>
              <strong>69%</strong>
              <span>Priority Accuracy</span>
            </article>
            <article>
              <strong>ML</strong>
              <span>LinearSVC + TF-IDF</span>
            </article>
          </div>
        </div>

        <div className="landing-visual">
          <div className="landing-visual-arc" />
          <div className="landing-stat-grid">
            <article className="landing-stat-card">
              <h3>Queue Health</h3>
              <p>Open backlog reduced by 34%</p>
            </article>
            <article className="landing-stat-card">
              <h3>Prediction Engine</h3>
              <p>Real-time category and priority assignment</p>
            </article>
            <article className="landing-stat-card">
              <h3>SLA Alerting</h3>
              <p>Instant escalation for high urgency issues</p>
            </article>
          </div>
          <div className="landing-ticket-mock">
            <div className="mock-row">
              <strong>Ticket #4128</strong>
              <span>Incident</span>
              <em>High</em>
            </div>
            <div className="mock-row">
              <strong>Ticket #4129</strong>
              <span>Request</span>
              <em>Medium</em>
            </div>
            <div className="mock-row">
              <strong>Ticket #4130</strong>
              <span>Change</span>
              <em>Low</em>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-extra">
        <article className="landing-services card full">
          <p className="hero-tag">Shaping Support Operations</p>
          <h2>What Zenticket Delivers, End to End</h2>
          <p className="services-sub">
            Zenticket automates the full helpdesk intake workflow by transforming free-text
            issue descriptions into structured, prioritized, and trackable service tickets.
          </p>
          <div className="services-grid">
            <article className="service-item card-secondary">
              <h4>AI Ticket Classification</h4>
              <p>Automatically classify incoming issues into the right category for faster routing.</p>
            </article>
            <article className="service-item card-secondary">
              <h4>Priority Prediction</h4>
              <p>Predict urgency levels so teams can focus on high-impact incidents first.</p>
            </article>
            <article className="service-item card-secondary">
              <h4>Structured Ticket Creation</h4>
              <p>Generate clean ticket records with title, category, priority, and description.</p>
            </article>
            <article className="service-item card-secondary">
              <h4>History and Insights</h4>
              <p>Track ticket trends and export data for reporting and continuous process improvement.</p>
            </article>
          </div>
        </article>

        <article className="landing-showcase card">
          <p className="hero-tag">Showcase</p>
          <h3>Dashboard Built for Admin Control</h3>
          <p>
            Supervisors get real-time visibility over ticket status, priority distribution, and category trends from one cockpit.
          </p>
          <Link to="/admin-login" className="secondary-btn">Explore Admin View</Link>
        </article>

        <article className="landing-showcase card">
          <p className="hero-tag">For Teams</p>
          <h3>Create and Track Tickets in Seconds</h3>
          <p>
            Users can submit requests instantly, view prediction results, and monitor progress through the complete ticket lifecycle.
          </p>
          <Link to="/login" className="secondary-btn">Open User Workspace</Link>
        </article>
      </section>

      <section className="landing-proof card">
        <h2>Model Performance Snapshot</h2>
        <div className="proof-grid">
          <article><strong>86.47%</strong><span>Category Accuracy</span></article>
          <article><strong>69.40%</strong><span>Priority Accuracy</span></article>
          <article><strong>LinearSVC</strong><span>Classifier</span></article>
          <article><strong>TF-IDF</strong><span>Feature Pipeline</span></article>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Ready to Build Your AI Ticketing Workflow?</h2>
        <p>Join Zenticket and modernize support triage with machine learning.</p>
        <div className="hero-buttons">
          <Link to="/signup" className="primary-btn">Get Started</Link>
          <Link to="/about" className="secondary-btn">Learn More</Link>
        </div>
      </section>
    </div>
  );
}


