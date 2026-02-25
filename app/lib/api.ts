export interface Annotation {
 id: string;
  type: "highlight" | "comment" | "source";
  text: string;
  comment?: string;
  sectionTitle: string;
  createdAt: string;
  // Source-specific fields
  sourceTitle?: string;
  sourceUrl?: string;
  sourceDescription?: string;
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface BriefResponse {
  brand_description: string;
  creative_brief: string;
  memories_used: number;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  response: string;
  role: string;
}

export interface PromptTemplates {
  deeper: string[];
  challenge: string[];
  iterate: string[];
  execution: string[];
  strategy: string[];
  audience: string[];
}

export async function generateBrief(brandDescription: string): Promise<BriefResponse> {
  const response = await fetch(`${API_URL}/brief`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brand_description: brandDescription }),
  });
  if (!response.ok) throw new Error("Failed to generate brief");
  return response.json();
}

export async function sendChatMessage(
  brandDescription: string,
  creativeBrief: string,
  messages: Message[],
  userMessage: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brand_description: brandDescription,
      creative_brief: creativeBrief,
      messages,
      user_message: userMessage,
    }),
  });
  if (!response.ok) throw new Error("Failed to send message");
  return response.json();
}

export async function getPromptTemplates(): Promise<PromptTemplates> {
  const response = await fetch(`${API_URL}/prompt-templates`);
  if (!response.ok) throw new Error("Failed to fetch templates");
  return response.json();
}

export interface Source {
  id: string;
  title: string;
  url: string;
  description: string;
  addedAt: string;
}

export function parseSources(content: string): { cleanContent: string; sources: Source[] } {
  const sectionIndex = content.search(/##\s*SOURCES/i);
  if (sectionIndex === -1) return { cleanContent: content, sources: [] };
  const cleanContent = content.slice(0, sectionIndex).trim();
  const sourceBlock = content.slice(sectionIndex);
  const sources: Source[] = [];
  const sourceLines = sourceBlock.split("\n");
  for (const line of sourceLines) {
    const noUrl = line.match(/^-\s+\[([^\]]+)\]\s+"([^"]+)"\s*[\u2014\u2013-]+\s*(.+)/);
    if (noUrl) {
      sources.push({ id: crypto.randomUUID(), title: noUrl[1] + " — " + noUrl[2], url: "", description: noUrl[3].trim().slice(0, 150), addedAt: new Date().toISOString() });
      continue;
    }
    const withUrl = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (withUrl) {
      const after = line.slice(line.indexOf(withUrl[0]) + withUrl[0].length);
      const desc = after.match(/[\u2014\u2013-]\s*(.+)/);
      sources.push({ id: crypto.randomUUID(), title: withUrl[1], url: withUrl[2], description: desc?.[1]?.trim().slice(0, 150) ?? "", addedAt: new Date().toISOString() });
    }
  }
  return { cleanContent, sources };
}

export interface SessionSummary {
  id: string;
  brand_description: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  brand_description: string;
  creative_brief: string;
  messages: Message[];
  annotations: Annotation[];
  created_at: string;
  updated_at: string;
}

export async function saveSession(session: {
  id: string;
  brand_description: string;
  creative_brief: string;
  messages: Message[];
  annotations: Annotation[];
}): Promise<void> {
  await fetch(`${API_URL}/sessions/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  });
}

export async function getSessions(): Promise<SessionSummary[]> {
  const res = await fetch(`${API_URL}/sessions`);
  return res.json();
}

export async function getSession(id: string): Promise<Session> {
  const res = await fetch(`${API_URL}/sessions/${id}`);
  return res.json();
}

export async function deleteSession(id: string): Promise<void> {
  await fetch(`${API_URL}/sessions/${id}`, { method: "DELETE" });
}