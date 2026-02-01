"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type {
  AgentType,
  TaskPriority,
  TaskStatus,
  TriggerType,
  ConvexAgentTask,
} from "@/types/convex";

export function useAgentTasks(options?: {
  status?: TaskStatus;
  agentType?: AgentType;
  priority?: TaskPriority;
  limit?: number;
}) {
  const tasks = useQuery(api.agentTasks.list, {
    status: options?.status,
    agentType: options?.agentType,
    priority: options?.priority,
    limit: options?.limit,
  });

  return {
    tasks: tasks as ConvexAgentTask[] | undefined,
    isLoading: tasks === undefined,
  };
}

export function useActiveTasks(limit?: number) {
  const tasks = useQuery(api.agentTasks.listActive, { limit });

  return {
    tasks: tasks as ConvexAgentTask[] | undefined,
    isLoading: tasks === undefined,
  };
}

export function usePendingTasks(limit?: number) {
  const tasks = useQuery(api.agentTasks.list, {
    status: "queued",
    limit,
  });

  return {
    tasks: tasks as ConvexAgentTask[] | undefined,
    isLoading: tasks === undefined,
  };
}

export function useRunningTasks(limit?: number) {
  const tasks = useQuery(api.agentTasks.list, {
    status: "running",
    limit,
  });

  return {
    tasks: tasks as ConvexAgentTask[] | undefined,
    isLoading: tasks === undefined,
  };
}

export function useAgentTask(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const task = useQuery(api.agentTasks.getById, { id: id as any });

  return {
    task: task as ConvexAgentTask | null | undefined,
    isLoading: task === undefined,
  };
}

export function usePendingTaskCount() {
  const count = useQuery(api.agentTasks.countPending);

  return {
    count: count ?? 0,
    isLoading: count === undefined,
  };
}

export function useTaskStats() {
  const stats = useQuery(api.agentTasks.getStats);

  return {
    stats,
    isLoading: stats === undefined,
  };
}

export function useTriggerTask() {
  const createTask = useMutation(api.agentTasks.create);

  return async (params: {
    agentType: AgentType;
    title: string;
    description?: string;
    priority: TaskPriority;
    triggeredBy?: TriggerType;
    payload?: unknown;
  }) => {
    return await createTask({
      agentType: params.agentType,
      title: params.title,
      description: params.description,
      priority: params.priority,
      triggeredBy: params.triggeredBy ?? "manual",
      payload: params.payload,
    });
  };
}

export function useCancelTask() {
  const cancelTask = useMutation(api.agentTasks.cancel);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (id: string) => await cancelTask({ id: id as any });
}

export function useUpdateTaskStatus() {
  const updateStatus = useMutation(api.agentTasks.updateStatus);

  return async (id: string, status: TaskStatus) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateStatus({ id: id as any, status });
}

export function useUpdateTaskProgress() {
  const updateProgress = useMutation(api.agentTasks.updateProgress);

  return async (id: string, progress: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateProgress({ id: id as any, progress });
}
