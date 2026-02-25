"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SessionSummary, getSessions, deleteSession } from "../lib/api";

interface HistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onRestoreSession: (id: string) => void;
  currentSessionId: string | null;
}

export default function HistorySidebar({ isOpen, onToggle, onRestoreSession, currentSessionId }: HistorySidebarProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getSessions()
        .then(setSessions)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  function formatDate(iso: string) {
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? "Close history" : "Open history"}
        style={{
          position: "fixed",
          left: isOpen ? "300px" : "0px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "#F3F4F6",
          color: "#374151",
          border: "1px solid #D1D5DB",
          borderRadius: "0 8px 8px 0",
          padding: "12px 8px",
          cursor: "pointer",
          zIndex: 50,
          transition: "all 0.3s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          minHeight: "44px",
        }}
      >
        <span style={{ fontSize: "14px" }}>{isOpen ? "←" : "→"}</span>
        {!isOpen && (
          <span style={{ fontSize: "9px", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", writingMode: "vertical-rl", color: "#9CA3AF" }}>
            HISTORY
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                zIndex: 39, backdropFilter: "blur(2px)",
              }}
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              aria-label="Session history"
              style={{
                position: "fixed",
                left: 0, top: 0, bottom: 0,
                width: "300px",
                background: "#F8F9FB",
                borderRight: "1px solid #E5E7EB",
                zIndex: 40,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
              }}
            >
              {/* Header */}
              <div style={{
                padding: "24px 20px 16px",
                borderBottom: "1px solid #E5E7EB",
                position: "sticky", top: 0, background: "#F8F9FB",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "24px", height: "24px", background: "#1C44F1", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#FFFFFF", fontWeight: 900, fontSize: "11px" }}>A</span>
                  </div>
                  <h2 style={{ fontSize: "12px", fontFamily: "var(--font-geist-mono)", color: "#374151", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>
                    Past Sessions
                  </h2>
                </div>
                <p style={{ fontSize: "11px", color: "#9CA3AF", fontFamily: "var(--font-geist-mono)", marginTop: "8px" }}>
                  {sessions.length} sessions saved
                </p>
              </div>

              {/* Sessions list */}
              {loading ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ fontSize: "12px", color: "#9CA3AF", fontFamily: "var(--font-geist-mono)" }}
                  >
                    Loading...
                  </motion.div>
                </div>
              ) : sessions.length === 0 ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: "12px", textAlign: "center" }}>
                  <span style={{ fontSize: "32px", opacity: 0.3 }}>✦</span>
                  <p style={{ fontSize: "13px", color: "#9CA3AF", lineHeight: 1.6 }}>
                    No past sessions yet. Generate your first brief to get started.
                  </p>
                </div>
              ) : (
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {sessions.map((session) => (
                   <motion.div
  key={session.id}
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  onClick={() => { onRestoreSession(session.id); onToggle(); }}
                      style={{
                        background: currentSessionId === session.id ? "rgba(28,68,241,0.06)" : "#0A0A0A",
                        border: currentSessionId === session.id ? "1px solid rgba(28,68,241,0.2)" : "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "10px",
                        padding: "14px",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        width: "100%",
                        transition: "all 0.15s",
                      }}
                      whileHover={{ background: "#F3F4F6", borderColor: "#D1D5DB" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <p style={{ fontSize: "13px", color: "#0A0A0A", fontWeight: 600, lineHeight: 1.4, flex: 1, textAlign: "left" }}>
                          {session.brand_description.length > 50
                            ? session.brand_description.slice(0, 50) + "..."
                            : session.brand_description}
                        </p>
                        <button
                          onClick={(e) => handleDelete(e, session.id)}
                          aria-label="Delete session"
                          style={{
                            background: "none", border: "none", color: "#9CA3AF",
                            cursor: "pointer", fontSize: "14px", lineHeight: 1,
                            padding: "2px 4px", flexShrink: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <p style={{ fontSize: "11px", color: "#9CA3AF", fontFamily: "var(--font-geist-mono)" }}>
                        {formatDate(session.updated_at)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}