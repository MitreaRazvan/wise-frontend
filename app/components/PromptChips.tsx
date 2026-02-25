"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PromptTemplates } from "../lib/api";

interface PromptChipsProps {
  templates: PromptTemplates;
  onSelect: (prompt: string) => void;
}

const CATEGORIES = [
  { key: "deeper",    label: "Go Deeper" },
  { key: "challenge", label: "Challenge" },
  { key: "iterate",   label: "Iterate" },
  { key: "execution", label: "Execute" },
  { key: "strategy",  label: "Strategy" },
  { key: "audience",  label: "Audience" },
] as const;

export default function PromptChips({ templates, onSelect }: PromptChipsProps) {
  const [activeCategory, setActiveCategory] = useState<string>("deeper");
  const activePrompts = templates[activeCategory as keyof PromptTemplates] || [];

  return (
    <div role="region" aria-label="Prompt suggestions">
      <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                fontSize: "12px", fontWeight: 600, padding: "6px 14px",
                borderRadius: "20px", border: "1px solid",
                borderColor: isActive ? "var(--accent)" : "var(--border)",
                background: isActive ? "var(--accent-bg)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                cursor: "pointer", minHeight: "36px", whiteSpace: "nowrap",
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          role="tabpanel"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
        >
          {activePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => onSelect(prompt)}
              style={{
                fontSize: "13px", padding: "10px 14px", borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
                cursor: "pointer", textAlign: "left", lineHeight: 1.4,
                maxWidth: "300px", minHeight: "44px",
                display: "flex", alignItems: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.background = "var(--accent-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.background = "var(--bg-surface)";
              }}
            >
              {prompt.length > 65 ? prompt.slice(0, 65) + "…" : prompt}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
