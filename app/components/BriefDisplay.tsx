"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BriefResponse } from "../lib/api";

interface BriefDisplayProps {
  brief: BriefResponse;
}

// Parse ARIA's markdown-style output into sections
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

export default function BriefDisplay({ brief }: BriefDisplayProps) {
  const sections = parseBrief(brief.creative_brief);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Creative Brief</h2>
          <p className="text-sm text-muted-foreground mt-1">
            for <span className="font-medium text-foreground">{brief.brand_description}</span>
          </p>
        </div>
        {brief.memories_used > 0 && (
          <Badge variant="secondary" className="text-xs">
            ✦ Memory Informed
          </Badge>
        )}
      </div>

      <Separator />

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="space-y-2"
          >
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {section.title}
            </h3>
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
              {section.content}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}