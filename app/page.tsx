"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateBrief,
  sendChatMessage,
  getPromptTemplates,
  BriefResponse,
  Message,
  PromptTemplates,
  Annotation,
  Source,
  saveSession,
  getSession,
  SessionSummary,
  getSessions,
  deleteSession,
} from "./lib/api";
import PromptChips from "./components/PromptChips";
import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "./components/ThemeContext";
import ChatMessage from "./components/ChatMessage";
import AnnotatableSection from "./components/AnnotatableSection";
import AnnotationPanel from "./components/AnnotationPanel";
import { exportToPdf } from "./lib/exportPdf";
import SummaryPage from "./components/SummaryPage";

function parseBrief(text: string) {
  const sections: { title: string; content: string }[] = [];
  const parts = text.split(/^## /m).filter(Boolean);
  for (const part of parts) {
    const lines = part.trim().split("\n");
    const title = lines[0].trim();
    const content = lines.slice(1).join("\n").trim();
    sections.push({ title, content });
  }
  return sections;
}

type Phase = "input" | "loading" | "brief" | "chat" | "summary";

// ── Send Button ───────────────────────────────────────────────────────────────
function SendButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Send"
      style={{
        width: "44px", height: "44px", flexShrink: 0,
        background: disabled ? "var(--border)" : "#1C44F1",
        border: "none", borderRadius: "12px",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="M3 9H15M15 9L10 4M15 9L10 14"
          stroke={disabled ? "#9CA3AF" : "#FFFFFF"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// ── Left Sidebar ──────────────────────────────────────────────────────────────
function LeftSidebar({
  isOpen, phase, brief, sessions, currentSessionId,
  onNewBrief, onRestoreSession, onDeleteSession, onNavigate,
}: {
  isOpen: boolean; phase: Phase; brief: BriefResponse | null;
  sessions: SessionSummary[]; currentSessionId: string;
  onNewBrief: () => void; onRestoreSession: (id: string) => void;
  onDeleteSession: (id: string) => void; onNavigate: (p: Phase) => void;
}) {
  function formatDate(iso: string) {
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  return (
    <motion.aside
      aria-label="Navigation sidebar"
      aria-hidden={!isOpen}
      initial={false}
      animate={{ width: isOpen ? 260 : 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      style={{
        height: "100vh", borderRight: "1px solid var(--border)",
        background: "var(--bg-sidebar)", display: "flex", flexDirection: "column",
        position: "sticky", top: 0, overflow: "hidden", flexShrink: 0,
      }}
    >
      <div style={{ padding: "0 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", height: "61px" }}>
        <img src={useTheme().theme === "dark" ? "/logosvgwhite.svg" : "/logosvg.svg"} alt="Wise" style={{ height: "16px" }} />
      </div>

      <div style={{ padding: "12px" }}>
        <button
          onClick={onNewBrief}
          style={{
            width: "100%", background: "var(--accent)", color: "var(--bg-base)",
            border: "none", borderRadius: "10px", padding: "10px 16px",
            fontSize: "14px", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px",
            minHeight: "44px", whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: "20px", lineHeight: 1, marginTop: "-2px" }}>+</span>
          New Brief
        </button>
      </div>

      {brief && (
        <div style={{ padding: "4px 12px 12px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "11px", color: "var(--text-tertiary)", letterSpacing: "0.08em", fontWeight: 700, padding: "4px 8px 6px" }}>
            CURRENT SESSION
          </p>
          {([
            { label: "Brief", p: "brief" as Phase },
            { label: "Chat", p: "chat" as Phase },
            { label: "Summary", p: "summary" as Phase },
          ]).map((item) => (
            <button key={item.p} onClick={() => onNavigate(item.p)} style={{
              width: "100%", display: "flex", alignItems: "center",
              padding: "10px 12px", borderRadius: "8px", border: "none",
              background: phase === item.p ? "var(--bg-hover)" : "transparent",
              color: phase === item.p ? "var(--text-primary)" : "var(--text-secondary)",
              fontSize: "14px", cursor: "pointer", textAlign: "left",
              fontWeight: phase === item.p ? 600 : 400, minHeight: "44px", whiteSpace: "nowrap",
            }}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
        <p style={{ fontSize: "11px", color: "var(--text-tertiary)", letterSpacing: "0.08em", fontWeight: 700, padding: "4px 8px 8px" }}>
          HISTORY
        </p>
        {sessions.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-muted)", padding: "8px", textAlign: "center" }}>No past sessions yet</p>
        ) : sessions.map((session) => (
          <div key={session.id} style={{
            display: "flex", alignItems: "center", borderRadius: "8px", marginBottom: "2px",
            background: session.id === currentSessionId ? "var(--bg-hover)" : "transparent",
          }}>
            <button onClick={() => onRestoreSession(session.id)} style={{
              flex: 1, display: "flex", flexDirection: "column", gap: "2px",
              padding: "10px 12px", border: "none", background: "transparent",
              cursor: "pointer", textAlign: "left", borderRadius: "8px",
              minWidth: 0, minHeight: "44px", justifyContent: "center",
            }}>
              <span style={{
                fontSize: "13px",
                color: session.id === currentSessionId ? "var(--text-primary)" : "var(--text-primary)",
                fontWeight: session.id === currentSessionId ? 600 : 400,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
              }}>
                {session.brand_description.length > 26 ? session.brand_description.slice(0, 26) + "..." : session.brand_description}
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>{formatDate(session.updated_at)}</span>
            </button>
            <button
              onClick={() => onDeleteSession(session.id)}
              aria-label={`Delete session: ${session.brand_description}`}
              style={{
                background: "none", border: "none", color: "var(--text-muted)",
                cursor: "pointer", padding: "8px", fontSize: "18px",
                borderRadius: "6px", flexShrink: 0,
                minHeight: "44px", minWidth: "40px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#9CA3AF"; }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </motion.aside>
  );
}

// ── Example prompts shown on home page ────────────────────────────────────────
const EXAMPLE_PROMPTS = [
  { category: "FASHION", prompt: "A sustainable sneaker brand for Gen Z climate activists" },
  { category: "TECH", prompt: "A mental health app for burned out millennials" },
  { category: "FOOD", prompt: "A luxury coffee brand that only sells one perfect product" },
  { category: "LIFESTYLE", prompt: "A minimalist skincare brand for men who hate skincare routines" },
  { category: "MEDIA", prompt: "An independent music label championing local underground artists" },
  { category: "FINANCE", prompt: "A fintech brand making investing feel human and approachable" },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [brandDescription, setBrandDescription] = useState("");
  const [brief, setBrief] = useState<BriefResponse | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<PromptTemplates | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotationPanelOpen, setAnnotationPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
                {templates && messages.length <= 1 && (
                  <div style={{ padding: "0 0 16px 0" }}>
                    <PromptChips templates={templates} onSelect={(p) => { setUserInput(p); chatInputRef.current?.focus(); }} />
                  </div>
                )}
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const logo = isDark ? "/logosvgwhite.svg" : "/logosvg.svg";
  const icon = isDark ? "/iconwhite.png" : "/iconblue.png";
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getPromptTemplates().then(setTemplates).catch(console.error);
    getSessions().then(setSessions).catch(console.error);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  useEffect(() => {
    if (phase === "input") inputRef.current?.focus();
    if (phase === "chat") chatInputRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (!brief) return;
    saveSession({ id: sessionId, brand_description: brief.brand_description, creative_brief: brief.creative_brief, messages, annotations })
      .then(() => getSessions().then(setSessions))
      .catch(console.error);
  }, [messages, annotations, brief]);

  async function handleGenerateBrief(description?: string) {
    const input = description || brandDescription;
    if (!input.trim()) return;
    if (description) setBrandDescription(description);
    setPhase("loading");
    setError("");
    try {
      const result = await generateBrief(input);
      setBrief(result);
      setPhase("brief");
    } catch {
      setError("Wise is unavailable. Check the backend is running.");
      setPhase("input");
    }
  }

  function handleStartChat() {
    if (!brief) return;
    setMessages([{ role: "assistant", content: brief.creative_brief }]);
    setPhase("chat");
  }

  async function handleSendMessage(messageText?: string) {
    if (!brief) return;
    const text = messageText || userInput;
    if (!text.trim() || chatLoading) return;
    const newUserMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setUserInput("");
    setChatLoading(true);
    try {
      const response = await sendChatMessage(brief.brand_description, brief.creative_brief, updatedMessages, text);
      setMessages([...updatedMessages, { role: "assistant", content: response.response }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages([...updatedMessages, { role: "assistant", content: "Wise is temporarily unavailable. Please wait a moment and try again." }]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleReset() {
    setPhase("input"); setBrief(null); setMessages([]);
    setBrandDescription(""); setUserInput("");
    setAnnotations([]); setAnnotationPanelOpen(false);
  }

  function handleHighlight(text: string, sectionTitle: string) {
    setAnnotations((prev) => [...prev, { id: crypto.randomUUID(), type: "highlight", text, sectionTitle, createdAt: new Date().toISOString() }]);
    setAnnotationPanelOpen(true);
  }

  function handleComment(text: string, sectionTitle: string, comment: string) {
    setAnnotations((prev) => [...prev, { id: crypto.randomUUID(), type: "comment", text, sectionTitle, comment, createdAt: new Date().toISOString() }]);
    setAnnotationPanelOpen(true);
  }

  function handleDeleteAnnotation(id: string) {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleRestoreSession(id: string) {
    try {
      const session = await getSession(id);
      setBrief({ brand_description: session.brand_description, creative_brief: session.creative_brief, memories_used: 0 });
      setMessages(session.messages);
      setAnnotations(session.annotations);
      setPhase(session.messages.length > 0 ? "chat" : "brief");
    } catch (err) { console.error("Failed to restore session:", err); }
  }

  async function handleDeleteSession(id: string) {
    await deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  function handleExportPdf() {
    if (!brief) return;
    exportToPdf({ brandDescription: brief.brand_description, briefSections: parseBrief(brief.creative_brief), annotations });
  }

  function handleSaveSource(source: Source) {
    setAnnotations((prev) => [...prev, {
      id: crypto.randomUUID(), type: "source", text: source.title, sectionTitle: "Source",
      createdAt: new Date().toISOString(), sourceTitle: source.title, sourceUrl: source.url, sourceDescription: source.description,
    }]);
    setAnnotationPanelOpen(true);
  }

  function handleNavigate(p: Phase) {
    if (!brief) return;
    if (p === "chat" && messages.length === 0) { handleStartChat(); return; }
    setPhase(p);
  }

  const TOP_BAR_H = 61;

  return (
    <main id="main-content" style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "'Inter', sans-serif" }}>

      <LeftSidebar
        isOpen={sidebarOpen} phase={phase} brief={brief} sessions={sessions}
        currentSessionId={sessionId} onNewBrief={handleReset}
        onRestoreSession={handleRestoreSession} onDeleteSession={handleDeleteSession}
        onNavigate={handleNavigate}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* TOP BAR */}
        <div style={{
          height: `${TOP_BAR_H}px`, display: "flex", alignItems: "center", gap: "12px",
          padding: "0 24px", borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, background: "var(--bg-base)", zIndex: 20, flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
            style={{
              background: "none", border: "1px solid var(--border)", borderRadius: "8px",
              width: "36px", height: "36px", cursor: "pointer", color: "var(--text-secondary)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
              <rect y="0" width="16" height="2" rx="1" fill="currentColor" />
              <rect y="5" width="16" height="2" rx="1" fill="currentColor" />
              <rect y="10" width="16" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
          <ThemeToggle />

          {/* <AnimatePresence>
            {!sidebarOpen && (
              <motion.img src={logo} alt="Wise"
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }}
                style={{ height: "22px", flexShrink: 0 }}
              />
            )}
          </AnimatePresence> */}

          {brief && (
            <span style={{ fontSize: "13px", color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
              {brief.brand_description}
            </span>
          )}

          <div style={{ display: "flex", gap: "8px", marginLeft: "auto", flexShrink: 0 }}>
            {phase === "brief" && brief && (
              <>
                <button onClick={handleExportPdf} style={{ background: "none", border: "1px solid var(--border)", borderRadius: "8px", padding: "0 14px", height: "36px", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}>
                  ↓ Export PDF
                </button>
                <button onClick={handleStartChat} style={{ background: "var(--accent)", color: "var(--bg-base)", border: "none", borderRadius: "8px", padding: "0 16px", height: "36px", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Continue with Wise →
                </button>
              </>
            )}
            {phase === "chat" && (
              <>
                <button onClick={() => setAnnotationPanelOpen((p) => !p)} aria-pressed={annotationPanelOpen} style={{ background: annotationPanelOpen ? "var(--accent-bg)" : "none", border: "1px solid var(--border)", borderRadius: "8px", padding: "0 14px", height: "36px", fontSize: "13px", color: annotationPanelOpen ? "var(--accent)" : "var(--text-primary)", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}>
                  ✦ Notes{annotations.length > 0 ? ` (${annotations.length})` : ""}
                </button>
                <button onClick={() => setPhase("summary")} style={{ background: "var(--accent)", color: "var(--bg-base)", border: "none", borderRadius: "8px", padding: "0 16px", height: "36px", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Summary
                </button>
              </>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── INPUT ── */}
          {phase === "input" && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", minHeight: `calc(100vh - ${TOP_BAR_H}px)` }}
            >
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", gap: "28px" }}
              >
                {/* Hero */}
                <div style={{ textAlign: "center" }}>
                  <img src={logo} alt="Wise" style={{ height: "48px", marginBottom: "20px" }} />
                  <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "12px" }}>
                    What are we creating today?
                  </h1>
                  <p style={{ fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    Describe your brand and Wise will generate a full creative brief.
                  </p>
                </div>

                {/* Input pill */}
                <div style={{ background: "var(--bg-base)", border: "1.5px solid var(--border-strong)", borderRadius: "20px", padding: "10px 10px 10px 20px", display: "flex", alignItems: "flex-end", gap: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <label htmlFor="brand-input" className="sr-only">Describe your brand</label>
                  <textarea
                    ref={inputRef}
                    id="brand-input"
                    placeholder="Describe your brand, product, or campaign..."
                    rows={1}
                    value={brandDescription}
                    onChange={(e) => {
                      setBrandDescription(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerateBrief(); } }}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontSize: "16px", color: "var(--text-primary)", lineHeight: 1.6, padding: "4px 0", fontFamily: "inherit", minHeight: "44px" }}
                  />
                  <SendButton onClick={() => handleGenerateBrief()} disabled={!brandDescription.trim()} />
                </div>

                <p style={{ fontSize: "13px", color: "var(--text-tertiary)", textAlign: "center" }}>
                  Press Enter to generate · Shift + Enter for new line
                </p>

                {error && <p role="alert" style={{ fontSize: "14px", color: "#DC2626", textAlign: "center", fontWeight: 500 }}>{error}</p>}

                {/* Example prompts */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.08em", fontWeight: 600, textAlign: "center" }}>
                    OR TRY AN EXAMPLE
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {EXAMPLE_PROMPTS.map((ex) => (
                      <button
                        key={ex.prompt}
                        onClick={() => { setBrandDescription(ex.prompt); inputRef.current?.focus(); }}
                        style={{
                          background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px",
                          padding: "14px 16px", textAlign: "left", cursor: "pointer",
                          display: "flex", flexDirection: "column", gap: "6px",
                          transition: "all 0.15s", minHeight: "44px",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-bg)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface)"; }}
                      >
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.1em" }}>{ex.category}</span>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.4, fontWeight: 500 }}>{ex.prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ── LOADING ── */}
          {phase === "loading" && (
            <motion.div key="loading" role="status" aria-live="polite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "32px", minHeight: `calc(100vh - ${TOP_BAR_H}px)` }}
            >
              <motion.img src={icon} alt="" aria-hidden="true"
                animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: "52px", height: "52px" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                {["Analyzing cultural tension...", "Defining the audience...", "Crafting the visual world...", "Writing campaign concepts..."].map((text, i) => (
                  <motion.div key={text} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.6 }}
                    style={{ display: "flex", alignItems: "center", gap: "10px" }}
                  >
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ delay: i * 0.6, duration: 1, repeat: Infinity }}
                      style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent)" }}
                    />
                    <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{text}</span>
                  </motion.div>
                ))}
              </div>
              <span className="sr-only">Generating your creative brief...</span>
            </motion.div>
          )}

          {/* ── BRIEF ── */}
          {phase === "brief" && brief && (
            <motion.div key="brief" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
              <article aria-label={`Creative brief for ${brief.brand_description}`} style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 32px" }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "48px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", background: "var(--accent-bg)", borderRadius: "20px", padding: "5px 14px", marginBottom: "20px" }}>
                    <span style={{ fontSize: "12px", color: "var(--accent)", letterSpacing: "0.08em", fontWeight: 700 }}>CREATIVE BRIEF</span>
                  </div>
                  <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                    {brief.brand_description}
                  </h1>
                </motion.div>

                {parseBrief(brief.creative_brief).map((section, index) => (
                  <motion.div key={section.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                    <AnnotatableSection sectionTitle={section.title} content={section.content} index={index} onHighlight={handleHighlight} onComment={handleComment} />
                  </motion.div>
                ))}

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", paddingTop: "40px", borderTop: "1px solid var(--border)", marginTop: "20px" }}>
                  <button onClick={handleStartChat} style={{ background: "var(--accent)", color: "var(--bg-base)", border: "none", borderRadius: "10px", padding: "12px 24px", fontSize: "15px", fontWeight: 600, cursor: "pointer", minHeight: "44px" }}>
                    ✦ Explore this Brief
                  </button>
                  <button onClick={handleReset} style={{ background: "none", color: "var(--text-secondary)", border: "1.5px solid var(--border-strong)", borderRadius: "10px", padding: "12px 24px", fontSize: "15px", cursor: "pointer", minHeight: "44px", fontWeight: 500 }}>
                    ↺ New Brief
                  </button>
                </div>
              </article>
            </motion.div>
          )}

          {/* ── CHAT ── */}
          {phase === "chat" && brief && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: `calc(100vh - ${TOP_BAR_H}px)` }}
            >
              <div role="log" aria-live="polite" aria-label="Conversation with Wise"
                style={{ flex: 1, overflowY: "auto", padding: "32px", maxWidth: "760px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}
              >
                {messages.map((msg, i) => (
                  <div key={i}>
                    {i === 0 && msg.role === "assistant" ? (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
                          <img src={icon} alt="" aria-hidden="true" style={{ width: "20px", height: "20px" }} />
                          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent)" }}>WISE — CREATIVE BRIEF</span>
                        </div>
                        {parseBrief(msg.content).map((section, index) => (
                          <AnnotatableSection
                            key={section.title}
                            sectionTitle={section.title}
                            content={section.content}
                            index={index}
                            onHighlight={handleHighlight}
                            onComment={handleComment}
                          />
                        ))}
                      </div>
                    ) : (
                      <ChatMessage message={msg} index={i} onSourceSave={msg.role === "assistant" ? handleSaveSource : undefined} />
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="status" aria-label="Wise is thinking"
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 0" }}
                  >
                    <img src={icon} alt="" aria-hidden="true" style={{ width: "22px", height: "22px" }} />
                    <div style={{ display: "flex", gap: "5px" }}>
                      {[0, 1, 2].map((j) => (
                        <motion.div key={j} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }}
                          style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent)" }}
                        />
                      ))}
                    </div>
                    <span className="sr-only">Wise is generating a response</span>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Chat input */}
              <div style={{ position: "sticky", bottom: 0, padding: "12px 32px 20px", background: "linear-gradient(to bottom, transparent, var(--bg-base) 30%)", maxWidth: "760px", margin: "0 auto", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", background: "var(--bg-base)", border: "1.5px solid var(--border-strong)", borderRadius: "20px", padding: "10px 10px 10px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <label htmlFor="chat-input" className="sr-only">Message Wise</label>
                  <textarea
                    id="chat-input" ref={chatInputRef}
                    placeholder="Ask Wise to go deeper, iterate, or explore..."
                    rows={1}
                    value={userInput}
                    onChange={(e) => {
                      setUserInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontSize: "16px", color: "var(--text-primary)", lineHeight: 1.6, padding: "4px 0", fontFamily: "inherit", minHeight: "44px" }}
                  />
                  <SendButton onClick={() => handleSendMessage()} disabled={!userInput.trim() || chatLoading} />
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "8px", textAlign: "center" }}>
                  Enter to send · Shift + Enter for new line
                </p>
              </div>
            </motion.div>
          )}

          {/* ── SUMMARY ── */}
          {phase === "summary" && brief && (
            <SummaryPage brief={brief} messages={messages} annotations={annotations} onBack={() => setPhase("chat")} onReset={handleReset} />
          )}

        </AnimatePresence>

        {(phase === "brief" || phase === "chat") && (
          <AnnotationPanel annotations={annotations} isOpen={annotationPanelOpen} onToggle={() => setAnnotationPanelOpen((prev) => !prev)} onDelete={handleDeleteAnnotation} />
        )}
      </div>
    </main>
  );
}