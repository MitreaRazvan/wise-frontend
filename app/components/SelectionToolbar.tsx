"use client";

import { useState, useEffect, useRef } from "react";

interface SelectionToolbarProps {
  onHighlight: (text: string, sectionTitle: string) => void;
  onComment: (text: string, sectionTitle: string, comment: string) => void;
  sectionTitle: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface ToolbarState { x: number; y: number; text: string; visible: boolean; }

export default function SelectionToolbar({ onHighlight, onComment, sectionTitle, containerRef }: SelectionToolbarProps) {
  const [toolbar, setToolbar] = useState<ToolbarState>({ x: 0, y: 0, text: "", visible: false });
  const [mode, setMode] = useState<"toolbar" | "comment">("toolbar");
  const [commentText, setCommentText] = useState("");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const savedTextRef = useRef<string>("");

  useEffect(() => {
    if (mode === "comment" && commentInputRef.current) setTimeout(() => commentInputRef.current?.focus(), 50);
  }, [mode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function handleMouseUp() {
      requestAnimationFrame(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() ?? "";
        if (!text || text.length < 2) return;
        const range = selection?.getRangeAt(0);
        if (!range) return;
        const rect = range.getBoundingClientRect();
        const containerRect = container!.getBoundingClientRect();
        savedTextRef.current = text;
        setToolbar({ x: rect.left - containerRect.left + rect.width / 2, y: rect.top - containerRect.top - 8, text, visible: true });
        setMode("toolbar");
        setCommentText("");
      });
    }
    container.addEventListener("mouseup", handleMouseUp);
    return () => container.removeEventListener("mouseup", handleMouseUp);
  }, [containerRef]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        if (!window.getSelection()?.toString().trim()) {
          setToolbar((prev) => ({ ...prev, visible: false }));
          setMode("toolbar"); setCommentText("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleHighlightClick() {
    onHighlight(savedTextRef.current, sectionTitle);
    setToolbar((prev) => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
  }

  function handleCommentClick() {
    savedTextRef.current = toolbar.text;
    setMode("comment");
    window.getSelection()?.removeAllRanges();
  }

  function handleSaveComment() {
    if (!commentText.trim()) return;
    onComment(savedTextRef.current, sectionTitle, commentText.trim());
    setToolbar((prev) => ({ ...prev, visible: false }));
    setMode("toolbar"); setCommentText("");
  }

  function handleDismiss() {
    setToolbar((prev) => ({ ...prev, visible: false }));
    setMode("toolbar"); setCommentText("");
    window.getSelection()?.removeAllRanges();
  }

  if (!toolbar.visible) return null;

  return (
    <div
      ref={toolbarRef}
      data-toolbar="true"
      role="toolbar"
      aria-label="Text annotation options"
      style={{ position: "absolute", top: `${toolbar.y}px`, left: `${toolbar.x}px`, transform: "translate(-50%, -100%)", zIndex: 200, pointerEvents: "all" }}
    >
      {mode === "toolbar" ? (
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "var(--bg-base)", border: "1px solid var(--border)",
          borderRadius: "10px", padding: "6px 8px",
          boxShadow: "var(--shadow-lg)", whiteSpace: "nowrap",
        }}>
          <button onClick={handleHighlightClick} aria-label="Highlight selected text" style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
            borderRadius: "6px", padding: "6px 14px", fontSize: "13px",
            color: "var(--accent)", cursor: "pointer", fontWeight: 700, minHeight: "36px",
          }}>
            ✦ Highlight
          </button>
          <button onClick={handleCommentClick} aria-label="Add comment to selected text" style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "6px", padding: "6px 14px", fontSize: "13px",
            color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600, minHeight: "36px",
          }}>
            ◎ Comment
          </button>
          <button onClick={handleDismiss} aria-label="Dismiss" style={{
            background: "none", border: "none", color: "var(--text-muted)",
            cursor: "pointer", fontSize: "18px", padding: "4px 6px", minHeight: "36px", lineHeight: 1,
          }}>×</button>
        </div>
      ) : (
        <div style={{
          background: "var(--bg-base)", border: "1px solid var(--border)",
          borderRadius: "12px", padding: "16px",
          boxShadow: "var(--shadow-lg)", width: "320px",
          display: "flex", flexDirection: "column", gap: "12px",
        }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 700 }}>ADD COMMENT</p>
          <div style={{ borderLeft: "2px solid var(--accent)", paddingLeft: "12px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.6 }}>
              "{savedTextRef.current.length > 80 ? savedTextRef.current.slice(0, 80) + "…" : savedTextRef.current}"
            </p>
          </div>
          <textarea
            ref={commentInputRef}
            placeholder="Write your comment... (⌘↵ to save)"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            aria-label="Comment text"
            style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: "8px", padding: "10px 12px", fontSize: "14px",
              color: "var(--text-primary)", fontFamily: "inherit",
              resize: "none", outline: "none", minHeight: "80px", lineHeight: 1.6, width: "100%",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) { e.preventDefault(); handleSaveComment(); }
              if (e.key === "Escape") setMode("toolbar");
            }}
          />
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button onClick={() => { setMode("toolbar"); setCommentText(""); }} style={{
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500,
              cursor: "pointer", padding: "8px 16px", minHeight: "36px", borderRadius: "8px",
            }}>Cancel</button>
            <button onClick={handleSaveComment} disabled={!commentText.trim()} style={{
              background: commentText.trim() ? "var(--accent)" : "var(--border)",
              color: commentText.trim() ? "var(--bg-base)" : "var(--text-muted)",
              border: "none", borderRadius: "8px", padding: "8px 16px",
              fontSize: "13px", fontWeight: 600,
              cursor: commentText.trim() ? "pointer" : "not-allowed", minHeight: "36px",
            }}>Save Comment</button>
          </div>
        </div>
      )}
      <div aria-hidden="true" style={{
        position: "absolute", bottom: "-6px", left: "50%", transform: "translateX(-50%)",
        width: 0, height: 0,
        borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
        borderTop: "6px solid var(--bg-base)",
        filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))",
      }} />
    </div>
  );
}
