"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Annotation } from "../lib/api";

interface AnnotationPanelProps {
  annotations: Annotation[];
  isOpen: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
}

export default function AnnotationPanel({ annotations, isOpen, onToggle, onDelete }: AnnotationPanelProps) {
  const highlights = annotations.filter((a) => a.type === "highlight");
  const comments = annotations.filter((a) => a.type === "comment");
  const sources = annotations.filter((a) => a.type === "source");

  return (
    <>
      <button
        onClick={onToggle}
        aria-label={isOpen ? "Close annotations panel" : "Open annotations panel"}
        aria-expanded={isOpen}
        style={{
          position: "fixed",
          right: isOpen ? "320px" : "0px",
          top: "50%",
          transform: "translateY(-50%)",
          background: annotations.length > 0 ? "var(--accent)" : "var(--bg-surface)",
          color: annotations.length > 0 ? "var(--bg-base)" : "var(--text-secondary)",
          border: "1px solid var(--border-strong)",
          borderRadius: "8px 0 0 8px",
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
        <span style={{ fontSize: "14px" }}>{isOpen ? "→" : "←"}</span>
        {annotations.length > 0 && (
          <span style={{ fontSize: "10px", fontWeight: 700 }}>{annotations.length}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            aria-label="Annotations panel"
            style={{
              position: "fixed", right: 0, top: 0, bottom: 0,
              width: "320px",
              background: "var(--bg-surface)",
              borderLeft: "1px solid var(--border)",
              zIndex: 40,
              display: "flex", flexDirection: "column", overflowY: "auto",
            }}
          >
            <div style={{
              padding: "24px 20px 16px",
              borderBottom: "1px solid var(--border)",
              position: "sticky", top: 0,
              background: "var(--bg-surface)",
            }}>
              <h2 style={{ fontSize: "12px", color: "var(--text-secondary)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>
                Annotations
              </h2>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                {annotations.length} saved
              </p>
            </div>

            {annotations.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: "12px", textAlign: "center" }}>
                <span style={{ fontSize: "32px", opacity: 0.3, color: "var(--text-primary)" }}>✦</span>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Select any text to highlight or comment on it
                </p>
              </div>
            ) : (
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "24px" }}>

                {highlights.length > 0 && (
                  <section aria-label="Highlights">
                    <h3 style={{ fontSize: "10px", color: "var(--accent)", letterSpacing: "0.2em", marginBottom: "12px", fontWeight: 700 }}>
                      HIGHLIGHTS ({highlights.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {highlights.map((annotation) => (
                        <motion.div key={annotation.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                          style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "10px", color: "var(--accent)", letterSpacing: "0.1em", fontWeight: 600 }}>
                              {annotation.sectionTitle.toUpperCase()}
                            </span>
                            <button onClick={() => onDelete(annotation.id)} aria-label="Delete highlight"
                              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0" }}>
                              ×
                            </button>
                          </div>
                          <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.6, fontStyle: "italic" }}>
                            "{annotation.text}"
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {comments.length > 0 && (
                  <section aria-label="Comments">
                    <h3 style={{ fontSize: "10px", color: "var(--text-secondary)", letterSpacing: "0.2em", marginBottom: "12px", fontWeight: 700 }}>
                      COMMENTS ({comments.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {comments.map((annotation) => (
                        <motion.div key={annotation.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                              {annotation.sectionTitle.toUpperCase()}
                            </span>
                            <button onClick={() => onDelete(annotation.id)} aria-label="Delete comment"
                              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0" }}>
                              ×
                            </button>
                          </div>
                          <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic", borderLeft: "2px solid var(--border-strong)", paddingLeft: "10px", lineHeight: 1.5 }}>
                            "{annotation.text.length > 80 ? annotation.text.slice(0, 80) + "..." : annotation.text}"
                          </p>
                          <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.6, background: "var(--bg-hover)", padding: "10px", borderRadius: "6px" }}>
                            {annotation.comment}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {sources.length > 0 && (
                  <section aria-label="Saved sources">
                    <h3 style={{ fontSize: "10px", color: "var(--text-secondary)", letterSpacing: "0.2em", marginBottom: "12px", fontWeight: 700 }}>
                      SOURCES ({sources.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {sources.map((annotation) => (
                        <motion.div key={annotation.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>SOURCE</span>
                            <button onClick={() => onDelete(annotation.id)} aria-label="Delete source"
                              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0" }}>
                              ×
                            </button>
                          </div>
                          <a href={annotation.sourceUrl ?? "#"} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: "13px", color: "var(--accent)", textDecoration: "none", lineHeight: 1.4 }}>
                            &#x2197; {annotation.sourceTitle}
                          </a>
                          {annotation.sourceDescription && (
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                              {annotation.sourceDescription}
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
