"use client";

import { motion } from "framer-motion";
import { BriefResponse, Message, Annotation } from "../lib/api";
import { exportToPdf } from "../lib/exportPdf";

function parseBrief(text: string) {
  const sections: { title: string; content: string }[] = [];
  const parts = text.split(/^## /m).filter(Boolean);
  for (const part of parts) {
    const lines = part.trim().split("\n");
    sections.push({ title: lines[0].trim(), content: lines.slice(1).join("\n").trim() });
  }
  return sections;
}

interface SummaryPageProps {
  brief: BriefResponse;
  messages: Message[];
  annotations: Annotation[];
  onBack: () => void;
  onReset: () => void;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
      <div style={{ width: "3px", height: "20px", background: "var(--accent)", borderRadius: "2px" }} />
      <h2 style={{ fontSize: "11px", color: "var(--accent)", letterSpacing: "0.2em", fontWeight: 700 }}>{label}</h2>
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
    </div>
  );
}

export default function SummaryPage({ brief, messages, annotations, onBack, onReset }: SummaryPageProps) {
  const sections = parseBrief(brief.creative_brief);
  const highlights = annotations.filter((a) => a.type === "highlight");
  const comments = annotations.filter((a) => a.type === "comment");
  const sources = annotations.filter((a) => a.type === "source");
  const chatMessages = messages.filter((_, i) => i > 0);

  function handleExport() {
    exportToPdf({ brandDescription: brief.brand_description, briefSections: sections, annotations });
  }

  function stripSources(content: string) {
    const idx = content.search(/## SOURCES/i);
    return idx !== -1 ? content.slice(0, idx).trim() : content.trim();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-base)" }}
    >
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: "61px",
        borderBottom: "1px solid var(--border)",
        position: "sticky", top: 0,
        background: "var(--bg-base)", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={onBack} style={{
            fontSize: "13px", color: "var(--text-secondary)",
            background: "none", border: "none", cursor: "pointer",
            minHeight: "44px", padding: "0 8px", fontWeight: 500,
          }}>
            ← Back to Chat
          </button>
          <div aria-hidden="true" style={{ width: "1px", height: "16px", background: "var(--border)" }} />
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
            borderRadius: "20px", padding: "5px 14px",
          }}>
            <span style={{ fontSize: "11px", color: "var(--accent)", letterSpacing: "0.1em", fontWeight: 700 }}>
              SESSION SUMMARY
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onReset} style={{
            fontSize: "13px", color: "var(--text-secondary)",
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "8px", cursor: "pointer", padding: "0 16px",
            minHeight: "36px", fontWeight: 500,
          }}>
            New Brief
          </button>
          <button onClick={handleExport} style={{
            fontSize: "13px", color: "var(--bg-base)",
            background: "var(--accent)", border: "none",
            borderRadius: "8px", cursor: "pointer",
            padding: "0 20px", minHeight: "36px", fontWeight: 700,
          }}>
            Export PDF
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "860px", margin: "0 auto", width: "100%", padding: "64px 48px", display: "flex", flexDirection: "column", gap: "80px" }}>

        {/* Hero stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ fontSize: "11px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "16px", fontWeight: 700 }}>
            CREATIVE BRIEF
          </p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "32px", color: "var(--text-primary)" }}>
            {brief.brand_description}
          </h1>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            {[
              { label: "Sections", value: sections.length },
              { label: "Chat Messages", value: chatMessages.length },
              { label: "Highlights", value: highlights.length },
              { label: "Comments", value: comments.length },
              { label: "Sources", value: sources.length },
            ].map((stat) => (
              <div key={stat.label}>
                <p style={{ fontSize: "28px", fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", letterSpacing: "0.08em", fontWeight: 600 }}>
                  {stat.label.toUpperCase()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Brief sections */}
        <section>
          <SectionHeader label="THE BRIEF" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {sections.map((section, i) => (
              <motion.div key={section.title}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "32px", padding: "32px 0", borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div>
                  <span style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 700, opacity: 0.6 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "4px", fontWeight: 700 }}>
                    {section.title}
                  </p>
                </div>
                <p style={{ fontSize: "15px", lineHeight: 1.8, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Chat */}
        {chatMessages.length > 0 && (
          <section>
            <SectionHeader label="CHAT WITH WISE" />
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {chatMessages.map((msg, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: msg.role === "user" ? "var(--text-tertiary)" : "var(--accent)" }}>
                    {msg.role === "user" ? "YOU" : "WISE"}
                  </span>
                  <div style={{
                    maxWidth: "600px", padding: "14px 18px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user" ? "var(--msg-user-bg)" : "var(--msg-ai-bg)",
                    border: `1px solid ${msg.role === "user" ? "var(--msg-user-border)" : "var(--msg-ai-border)"}`,
                    fontSize: "14px", lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap",
                  }}>
                    {stripSources(msg.content)}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <section>
            <SectionHeader label="HIGHLIGHTS" />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {highlights.map((a) => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  style={{ borderLeft: "3px solid var(--accent)", paddingLeft: "20px", paddingTop: "4px", paddingBottom: "4px" }}
                >
                  <p style={{ fontSize: "10px", color: "var(--accent)", letterSpacing: "0.1em", marginBottom: "6px", fontWeight: 700, opacity: 0.7 }}>
                    {a.sectionTitle.toUpperCase()}
                  </p>
                  <p style={{ fontSize: "15px", color: "var(--text-primary)", lineHeight: 1.7, fontStyle: "italic" }}>{a.text}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Comments */}
        {comments.length > 0 && (
          <section>
            <SectionHeader label="COMMENTS" />
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {comments.map((a) => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}
                >
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 700 }}>{a.sectionTitle.toUpperCase()}</p>
                  <p style={{ fontSize: "13px", color: "var(--text-tertiary)", fontStyle: "italic", borderLeft: "2px solid var(--border-strong)", paddingLeft: "12px", lineHeight: 1.6 }}>
                    {a.text.length > 120 ? a.text.slice(0, 120) + "..." : a.text}
                  </p>
                  <p style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.7 }}>{a.comment}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <section style={{ paddingBottom: "80px" }}>
            <SectionHeader label="SAVED SOURCES" />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {sources.map((a) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px 20px" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600 }}>{a.sourceTitle}</p>
                    {a.sourceDescription && (
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>{a.sourceDescription}</p>
                    )}
                  </div>
                  <a href={a.sourceUrl ?? "#"} target="_blank" rel="noopener noreferrer"
                    style={{
                      fontSize: "12px", color: "var(--accent)", textDecoration: "none",
                      display: "flex", alignItems: "center", gap: "6px",
                      background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
                      borderRadius: "6px", padding: "6px 12px", whiteSpace: "nowrap",
                      flexShrink: 0, marginLeft: "20px", fontWeight: 600,
                    }}
                  >
                    Open Source ↗
                  </a>
                </motion.div>
              ))}
            </div>
          </section>
        )}

      </div>
    </motion.div>
  );
}
