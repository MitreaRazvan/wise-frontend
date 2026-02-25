"use client";

import React from "react";
import { motion } from "framer-motion";
import { Message, Source, parseSources } from "../lib/api";

interface ChatMessageProps {
  message: Message;
  index: number;
  onSourceSave?: (source: Source) => void;
}

export default function ChatMessage({ message, index, onSourceSave }: ChatMessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        aria-label="Your message"
        style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}
      >
        <span aria-hidden="true" style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-tertiary)" }}>
          YOU
        </span>
        <div style={{
          maxWidth: "680px", padding: "14px 18px",
          borderRadius: "16px 16px 4px 16px",
          lineHeight: 1.75, whiteSpace: "pre-wrap",
          background: "var(--msg-user-bg)",
          border: "1px solid var(--msg-user-border)",
          color: "var(--text-primary)", fontSize: "15px",
        }}>
          {message.content}
        </div>
      </motion.article>
    );
  }

  const { cleanContent, sources } = parseSources(message.content);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Wise response"
      style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}
    >
      <span aria-hidden="true" style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent)" }}>
        WISE
      </span>
      <div style={{
        maxWidth: "680px", padding: "14px 18px",
        borderRadius: "16px 16px 16px 4px",
        lineHeight: 1.8, whiteSpace: "pre-wrap",
        background: "var(--msg-ai-bg)",
        border: "1px solid var(--msg-ai-border)",
        color: "var(--text-primary)", fontSize: "15px",
      }}>
        {cleanContent}
      </div>

      {sources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ maxWidth: "680px", width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}
        >
          <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600 }}>
            REFERENCES
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {sources.map((src) => (
              <div key={src.id} style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px", overflow: "hidden",
                display: "flex", alignItems: "stretch",
              }}>
                {/* Left accent bar */}
                <div style={{ width: "3px", background: "var(--accent)", flexShrink: 0 }} />

                <div style={{ flex: 1, padding: "10px 14px", display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                  <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600, lineHeight: 1.4 }}>
                    {src.title}
                  </span>
                  {src.description && (
                    <span style={{ fontSize: "12px", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
                      {src.description}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0", flexShrink: 0 }}>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={"Open: " + src.title}
                      style={{
                        fontSize: "13px", color: "var(--accent)",
                        padding: "10px 12px", textDecoration: "none",
                        display: "flex", alignItems: "center", gap: "4px",
                        borderLeft: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-bg)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      ↗
                    </a>
                  )}
                  {onSourceSave && (
                    <button
                      onClick={() => onSourceSave(src)}
                      aria-label={"Save source: " + src.title}
                      style={{
                        background: "none", border: "none",
                        borderLeft: "1px solid var(--border)",
                        color: "var(--text-muted)", cursor: "pointer",
                        padding: "10px 12px", fontSize: "14px",
                        display: "flex", alignItems: "center",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-bg)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                    >
                      ✦
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.article>
  );
}