"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentTypeBadge } from "./AgentTypeBadge";
import type { ConvexAgentRun, AgentRunStatus } from "@/types/convex";
import { useAgentRuns } from "@/hooks/use-agents";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Ban,
  AlertTriangle,
} from "lucide-react";

const statusConfig: Record<
  AgentRunStatus,
  { icon: React.ElementType; className: string }
> = {
  pending: { icon: Clock, className: "bg-blue-100 text-blue-800" },
  running: { icon: Play, className: "bg-green-100 text-green-800" },
  completed: { icon: CheckCircle, className: "bg-green-100 text-green-800" },
  failed: { icon: XCircle, className: "bg-red-100 text-red-800" },
  cancelled: { icon: Ban, className: "bg-gray-100 text-gray-800" },
  awaiting_approval: {
    icon: AlertTriangle,
    className: "bg-yellow-100 text-yellow-800",
  },
};

interface AgentRunHistoryProps {
  runs?: ConvexAgentRun[];
  isLoading?: boolean;
  limit?: number;
}

export function AgentRunHistory({
  runs: propRuns,
  isLoading: propIsLoading,
  limit = 20,
}: AgentRunHistoryProps) {
  const { runs: hookRuns, isLoading: hookIsLoading } = useAgentRuns({ limit });

  const runs = propRuns ?? hookRuns;
  const isLoading = propIsLoading ?? hookIsLoading;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No agent runs recorded yet.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Triggered By</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => {
            const statusConf = statusConfig[run.status];
            const StatusIcon = statusConf.icon;
            const duration =
              run.metrics?.duration ??
              (run.completedAt && run.startedAt
                ? run.completedAt - run.startedAt
                : null);

            return (
              <TableRow key={run._id}>
                <TableCell>
                  <AgentTypeBadge agentType={run.agentType} size="sm" />
                </TableCell>
                <TableCell>
                  <Badge className={statusConf.className}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {run.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{run.triggeredBy}</TableCell>
                <TableCell>
                  {duration ? `${(duration / 1000).toFixed(1)}s` : "-"}
                </TableCell>
                <TableCell>{run.metrics?.itemsProcessed ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(run.createdAt))} ago
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
