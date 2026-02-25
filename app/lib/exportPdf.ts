import jsPDF from "jspdf";
import { Annotation } from "./api";

interface ExportOptions {
  brandDescription: string;
  briefSections: { title: string; content: string }[];
  annotations: Annotation[];
}

const COLORS = {
  bg: [8, 11, 20] as [number, number, number],
  yellow: [245, 230, 66] as [number, number, number],
  white: [250, 250, 250] as [number, number, number],
  gray: [160, 168, 184] as [number, number, number],
  darkGray: [107, 114, 128] as [number, number, number],
  surface: [26, 29, 46] as [number, number, number],
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

function addPage(doc: jsPDF) {
  doc.addPage();
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  return MARGIN + 10;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - MARGIN) {
    return addPage(doc);
  }
  return y;
}

function drawText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options: {
    size?: number;
    color?: [number, number, number];
    maxWidth?: number;
    bold?: boolean;
    mono?: boolean;
  } = {}
): number {
  const { size = 10, color = COLORS.gray, maxWidth = CONTENT_W, bold = false } = options;
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.setFont("helvetica", bold ? "bold" : "normal");
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * (size * 0.4 + 1.5);
}

export async function exportToPdf({ brandDescription, briefSections, annotations }: ExportOptions) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const highlights = annotations.filter((a) => a.type === "highlight");
  const comments = annotations.filter((a) => a.type === "comment");
  const sources = annotations.filter((a) => a.type === "source");

  // ── COVER PAGE ──
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  // Yellow accent bar
  doc.setFillColor(...COLORS.yellow);
  doc.rect(0, 0, 4, PAGE_H, "F");

  // ARIA badge
  doc.setFillColor(...COLORS.yellow);
  doc.roundedRect(MARGIN, 40, 28, 12, 2, 2, "F");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.bg);
  doc.setFont("helvetica", "bold");
  doc.text("ARIA", MARGIN + 6, 48);

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.darkGray);
  doc.setFont("helvetica", "normal");
  doc.text("AI Creative Director", MARGIN + 32, 48);

  // Brand name
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  const brandLines = doc.splitTextToSize(brandDescription, CONTENT_W);
  doc.text(brandLines, MARGIN, 90);

  // Creative Brief label
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.yellow);
  doc.setFont("helvetica", "normal");
  doc.text("CREATIVE BRIEF", MARGIN, 82);

  // Date
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.darkGray);
  doc.text(`Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, MARGIN, PAGE_H - 20);

  // Stats row
  const statsY = PAGE_H - 40;
  const stats = [
    { label: "SECTIONS", value: String(briefSections.length) },
    { label: "HIGHLIGHTS", value: String(highlights.length) },
    { label: "COMMENTS", value: String(comments.length) },
    { label: "SOURCES", value: String(sources.length) },
  ];
  stats.forEach((stat, i) => {
    const x = MARGIN + i * 44;
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.yellow);
    doc.setFont("helvetica", "bold");
    doc.text(stat.value, x, statsY);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.darkGray);
    doc.setFont("helvetica", "normal");
    doc.text(stat.label, x, statsY + 5);
  });

  // ── BRIEF SECTIONS ──
  let y = addPage(doc);

  // Section header
  doc.setFillColor(...COLORS.yellow);
  doc.rect(MARGIN, y - 4, 2, 8, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.yellow);
  doc.setFont("helvetica", "bold");
  doc.text("CREATIVE BRIEF", MARGIN + 6, y);
  y += 12;

  briefSections.forEach((section, idx) => {
    y = checkPageBreak(doc, y, 30);

    // Section number
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.yellow);
    doc.setFont("helvetica", "bold");
    doc.text(String(idx + 1).padStart(2, "0"), MARGIN, y);

    // Section title
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.setFont("helvetica", "bold");
    doc.text(section.title.toUpperCase(), MARGIN + 8, y);
    y += 6;

    // Content
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.gray);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(section.content, CONTENT_W - 8);
    lines.forEach((line: string) => {
      y = checkPageBreak(doc, y, 6);
      doc.text(line, MARGIN + 8, y);
      y += 5;
    });

    // Divider
    y += 4;
    doc.setDrawColor(255, 255, 255, 10);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 8;
  });

  // ── HIGHLIGHTS & COMMENTS ──
  if (highlights.length > 0 || comments.length > 0) {
    y = addPage(doc);

    doc.setFillColor(...COLORS.yellow);
    doc.rect(MARGIN, y - 4, 2, 8, "F");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.yellow);
    doc.setFont("helvetica", "bold");
    doc.text("ANNOTATIONS", MARGIN + 6, y);
    y += 12;

    highlights.forEach((annotation) => {
      y = checkPageBreak(doc, y, 24);

      doc.setFillColor(...COLORS.surface);
      doc.roundedRect(MARGIN, y - 4, CONTENT_W, 20, 2, 2, "F");
      doc.setFillColor(...COLORS.yellow);
      doc.rect(MARGIN, y - 4, 2, 20, "F");

      doc.setFontSize(7);
      doc.setTextColor(...COLORS.yellow);
      doc.setFont("helvetica", "bold");
      doc.text("HIGHLIGHT · " + annotation.sectionTitle.toUpperCase(), MARGIN + 6, y + 1);

      doc.setFontSize(9);
      doc.setTextColor(...COLORS.white);
      doc.setFont("helvetica", "normal");
      const hLines = doc.splitTextToSize(`"${annotation.text}"`, CONTENT_W - 12);
      hLines.slice(0, 2).forEach((line: string, i: number) => {
        doc.text(line, MARGIN + 6, y + 7 + i * 5);
      });
      y += 26;
    });

    comments.forEach((annotation) => {
      y = checkPageBreak(doc, y, 32);

      doc.setFillColor(...COLORS.surface);
      doc.roundedRect(MARGIN, y - 4, CONTENT_W, 28, 2, 2, "F");

      doc.setFontSize(7);
      doc.setTextColor(...COLORS.darkGray);
      doc.setFont("helvetica", "bold");
      doc.text("COMMENT · " + annotation.sectionTitle.toUpperCase(), MARGIN + 6, y + 1);

      doc.setFontSize(8);
      doc.setTextColor(...COLORS.gray);
      doc.setFont("helvetica", "italic");
      const qLines = doc.splitTextToSize(`"${annotation.text.slice(0, 100)}..."`, CONTENT_W - 12);
      doc.text(qLines[0], MARGIN + 6, y + 7);

      doc.setFontSize(9);
      doc.setTextColor(...COLORS.white);
      doc.setFont("helvetica", "normal");
      const cLines = doc.splitTextToSize(annotation.comment ?? "", CONTENT_W - 12);
      cLines.slice(0, 2).forEach((line: string, i: number) => {
        doc.text(line, MARGIN + 6, y + 14 + i * 5);
      });
      y += 34;
    });
  }

  // ── SOURCES ──
  if (sources.length > 0) {
    y = addPage(doc);

    doc.setFillColor(...COLORS.yellow);
    doc.rect(MARGIN, y - 4, 2, 8, "F");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.yellow);
    doc.setFont("helvetica", "bold");
    doc.text("SAVED SOURCES", MARGIN + 6, y);
    y += 12;

    sources.forEach((annotation) => {
      y = checkPageBreak(doc, y, 20);

      doc.setFillColor(...COLORS.surface);
      doc.roundedRect(MARGIN, y - 4, CONTENT_W, 16, 2, 2, "F");

      doc.setFontSize(9);
      doc.setTextColor(...COLORS.yellow);
      doc.setFont("helvetica", "bold");
      doc.text(annotation.sourceTitle ?? "Source", MARGIN + 6, y + 2);

      if (annotation.sourceUrl) {
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.darkGray);
        doc.setFont("helvetica", "normal");
        doc.textWithLink(annotation.sourceUrl, MARGIN + 6, y + 8, { url: annotation.sourceUrl });
      }

      y += 22;
    });
  }

  // ── FOOTER on every page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.darkGray);
    doc.text(`ARIA Creative Director · ${brandDescription}`, MARGIN, PAGE_H - 8);
    doc.text(`${i} / ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 8, { align: "right" });
  }

  // Save
  const filename = `aria-brief-${brandDescription.slice(0, 30).replace(/\s+/g, "-").toLowerCase()}.pdf`;
  doc.save(filename);
}