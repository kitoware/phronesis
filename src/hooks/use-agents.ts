"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { AgentType, ConvexAgentRun } from "@/types/convex";

export function useAgentStatus(agentType: AgentType) {
  const result = useQuery(api.agentRuns.getLatestStatus, { agentType });
  return {
    status: result?.status ?? "idle",
    lastRun: result?.lastRun as ConvexAgentRun | null | undefined,
    isLoading: result === undefined,
  };
}

export function useAllAgentStatuses() {
  const result = useQuery(api.agentRuns.getAllLatestStatus);
  return {
    statuses: result as
      | Record<AgentType, { status: string; lastRun: ConvexAgentRun | null }>
      | undefined,
    isLoading: result === undefined,
  };
}

type ListableRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export function useAgentRuns(options?: {
  agentType?: AgentType;
  status?: ListableRunStatus;
  limit?: number;
}) {
  const runs = useQuery(api.agentRuns.list, {
    agentType: options?.agentType,
    status: options?.status,
    limit: options?.limit,
  });

  return {
    runs: runs as ConvexAgentRun[] | undefined,
    isLoading: runs === undefined,
  };
}

export function useAgentRunHistory(agentType: AgentType, limit = 10) {
  const runs = useQuery(api.agentRuns.list, {
    agentType,
    limit,
  });

  return {
    runs: runs as ConvexAgentRun[] | undefined,
    isLoading: runs === undefined,
  };
}

export function useAgentRunStats() {
  const stats = useQuery(api.agentRuns.getStats);
  return {
    stats,
    isLoading: stats === undefined,
  };
}

export function useAgentRunCountToday(agentType?: AgentType) {
  const count = useQuery(api.agentRuns.countToday, {
    agentType,
  });
  return {
    count: count ?? 0,
    isLoading: count === undefined,
  };
}
