"use client";

import { Badge } from "@/components/ui/badge";
import type { TaskPriority } from "@/types/convex";

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  critical: {
    label: "Critical",
    className: "bg-red-500 text-white hover:bg-red-500",
  },
  high: {
    label: "High",
    className: "bg-orange-500 text-white hover:bg-orange-500",
  },
  medium: {
    label: "Medium",
    className: "bg-yellow-500 text-black hover:bg-yellow-500",
  },
  low: {
    label: "Low",
    className: "bg-gray-500 text-white hover:bg-gray-500",
  },
};

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  size?: "sm" | "default";
}

export function TaskPriorityBadge({
  priority,
  size = "default",
}: TaskPriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge
      className={`${config.className} ${size === "sm" ? "px-1.5 py-0 text-xs" : ""}`}
    >
      {config.label}
    </Badge>
  );
}

export function getPriorityLabel(priority: TaskPriority): string {
  return priorityConfig[priority].label;
}
