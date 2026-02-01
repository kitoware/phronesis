"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ApprovalRequestCard } from "./ApprovalRequestCard";
import type { ConvexAgentApproval, TaskPriority } from "@/types/convex";
import { usePendingApprovals } from "@/hooks/use-agent-approvals";
import { CheckCircle } from "lucide-react";

const priorityOrder: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface ApprovalQueueProps {
  approvals?: ConvexAgentApproval[];
  isLoading?: boolean;
  sortByPriority?: boolean;
  showActions?: boolean;
  emptyMessage?: string;
  onActionComplete?: () => void;
}

export function ApprovalQueue({
  approvals: propApprovals,
  isLoading: propIsLoading,
  sortByPriority = true,
  showActions = true,
  emptyMessage = "No pending approvals",
  onActionComplete,
}: ApprovalQueueProps) {
  const { approvals: hookApprovals, isLoading: hookIsLoading } =
    usePendingApprovals();

  const approvals = propApprovals ?? hookApprovals;
  const isLoading = propIsLoading ?? hookIsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (!approvals || approvals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const sortedApprovals = sortByPriority
    ? [...approvals].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      )
    : approvals;

  return (
    <div className="space-y-4">
      {sortedApprovals.map((approval) => (
        <ApprovalRequestCard
          key={approval._id}
          approval={approval}
          showActions={showActions}
          onActionComplete={onActionComplete}
        />
      ))}
    </div>
  );
}
