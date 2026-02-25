"use client";
import { useRef } from "react";
import SelectionToolbar from "./SelectionToolbar";

interface AnnotatableSectionProps {
  sectionTitle: string;
  content: string;
  index?: number;
  onHighlight: (text: string, sectionTitle: string) => void;
  onComment: (text: string, sectionTitle: string, comment: string) => void;
  showIndex?: boolean;
}

export default function AnnotatableSection({ sectionTitle, content, index, onHighlight, onComment, showIndex = true }: AnnotatableSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: showIndex ? "160px 1fr" : "1fr",
        gap: "48px",
        paddingBottom: "48px",
        marginBottom: "48px",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <SelectionToolbar sectionTitle={sectionTitle} onHighlight={onHighlight} onComment={onComment} containerRef={containerRef} />

      {showIndex && (
        <div style={{ paddingTop: "4px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {index !== undefined && (
            <span aria-hidden="true" style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.1em" }}>
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
          <h2 style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {sectionTitle}
          </h2>
        </div>
      )}

      <p style={{ fontSize: "16px", lineHeight: 1.8, color: "var(--text-primary)", whiteSpace: "pre-wrap", userSelect: "text", cursor: "text" }}>
        {content}
      </p>
    </div>
  );
}
