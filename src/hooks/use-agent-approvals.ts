"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type {
  AgentType,
  ApprovalStatus,
  ConvexAgentApproval,
} from "@/types/convex";

export function useAgentApprovals(options?: {
  status?: ApprovalStatus;
  agentType?: AgentType;
  limit?: number;
}) {
  const approvals = useQuery(api.agentApprovals.list, {
    status: options?.status,
    agentType: options?.agentType,
    limit: options?.limit,
  });

  return {
    approvals: approvals as ConvexAgentApproval[] | undefined,
    isLoading: approvals === undefined,
  };
}

export function usePendingApprovals(limit?: number) {
  const approvals = useQuery(api.agentApprovals.listPending, { limit });

  return {
    approvals: approvals as ConvexAgentApproval[] | undefined,
    isLoading: approvals === undefined,
  };
}

export function useAgentApproval(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const approval = useQuery(api.agentApprovals.getById, { id: id as any });

  return {
    approval: approval as ConvexAgentApproval | null | undefined,
    isLoading: approval === undefined,
  };
}

export function useApprovalByRequestId(requestId: string) {
  const approval = useQuery(api.agentApprovals.getByRequestId, { requestId });

  return {
    approval: approval as ConvexAgentApproval | null | undefined,
    isLoading: approval === undefined,
  };
}

export function useApprovalCount() {
  const count = useQuery(api.agentApprovals.countPending);

  return {
    count: count ?? 0,
    isLoading: count === undefined,
  };
}

export function useApprovalStats() {
  const stats = useQuery(api.agentApprovals.getStats);

  return {
    stats,
    isLoading: stats === undefined,
  };
}

export function useApproveRequest() {
  const approve = useMutation(api.agentApprovals.approve);

  return async (id: string, options?: { reviewNotes?: string }) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await approve({ id: id as any, reviewNotes: options?.reviewNotes });
}

export function useRejectRequest() {
  const reject = useMutation(api.agentApprovals.reject);

  return async (id: string, options?: { reviewNotes?: string }) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await reject({ id: id as any, reviewNotes: options?.reviewNotes });
}
