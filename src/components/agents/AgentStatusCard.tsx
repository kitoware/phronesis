"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AgentType, AgentRunStatus } from "@/types/convex";
import { useAgentStatus, useAgentRunCountToday } from "@/hooks/use-agents";
import { getAgentTypeLabel } from "./AgentTypeBadge";
import {
  FileSearch,
  Lightbulb,
  TrendingUp,
  Search,
  Link2,
  FileText,
  Activity,
} from "lucide-react";

const agentIcons: Record<AgentType, React.ElementType> = {
  "research-ingestion": FileSearch,
  "insight-generation": Lightbulb,
  "trend-analysis": TrendingUp,
  "problem-discovery": Search,
  "research-linking": Link2,
  "solution-synthesis": FileText,
};

const statusConfig: Record<
  AgentRunStatus | "idle",
  { label: string; className: string }
> = {
  idle: {
    label: "Idle",
    className: "bg-gray-100 text-gray-800",
  },
  pending: {
    label: "Pending",
    className: "bg-blue-100 text-blue-800",
  },
  running: {
    label: "Running",
    className: "bg-green-100 text-green-800 animate-pulse",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-800",
  },
  awaiting_approval: {
    label: "Awaiting Approval",
    className: "bg-yellow-100 text-yellow-800",
  },
};

interface AgentStatusCardProps {
  agentType: AgentType;
  onClick?: () => void;
}

export function AgentStatusCard({ agentType, onClick }: AgentStatusCardProps) {
  const { status, lastRun, isLoading } = useAgentStatus(agentType);
  const { count: todayCount } = useAgentRunCountToday(agentType);

  const Icon = agentIcons[agentType];
  const statusConf = statusConfig[status as AgentRunStatus | "idle"];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${onClick ? "" : "cursor-default"}`}
            onClick={onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {getAgentTypeLabel(agentType)}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge className={statusConf.className}>
                  {statusConf.label}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Activity className="mr-1 h-3 w-3" />
                  {todayCount} today
                </div>
              </div>
              {lastRun && lastRun.completedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Last run: {new Date(lastRun.completedAt).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to view agent details</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
