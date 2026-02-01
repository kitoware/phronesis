"use client";

import { Badge } from "@/components/ui/badge";
import type { AgentType } from "@/types/convex";
import {
  FileSearch,
  Lightbulb,
  TrendingUp,
  Search,
  Link2,
  FileText,
} from "lucide-react";

const agentTypeConfig: Record<
  AgentType,
  { label: string; icon: React.ElementType; className: string }
> = {
  "research-ingestion": {
    label: "Research Ingestion",
    icon: FileSearch,
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  "insight-generation": {
    label: "Insight Generation",
    icon: Lightbulb,
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
  "trend-analysis": {
    label: "Trend Analysis",
    icon: TrendingUp,
    className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  },
  "problem-discovery": {
    label: "Problem Discovery",
    icon: Search,
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  },
  "research-linking": {
    label: "Research Linking",
    icon: Link2,
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  "solution-synthesis": {
    label: "Solution Synthesis",
    icon: FileText,
    className: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
  },
};

interface AgentTypeBadgeProps {
  agentType: AgentType;
  showIcon?: boolean;
  size?: "sm" | "default";
}

export function AgentTypeBadge({
  agentType,
  showIcon = true,
  size = "default",
}: AgentTypeBadgeProps) {
  const config = agentTypeConfig[agentType];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={`${config.className} ${size === "sm" ? "px-1.5 py-0 text-xs" : ""}`}
    >
      {showIcon && (
        <Icon className={`${size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} mr-1`} />
      )}
      {config.label}
    </Badge>
  );
}

export function getAgentTypeLabel(agentType: AgentType): string {
  return agentTypeConfig[agentType].label;
}
