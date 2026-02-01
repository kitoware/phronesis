"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard } from "./TaskCard";
import type { ConvexAgentTask, TaskPriority } from "@/types/convex";
import { useActiveTasks } from "@/hooks/use-agent-tasks";
import { ListX } from "lucide-react";

const priorityOrder: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface TaskQueueProps {
  tasks?: ConvexAgentTask[];
  isLoading?: boolean;
  sortByPriority?: boolean;
  showCancelButtons?: boolean;
  emptyMessage?: string;
}

export function TaskQueue({
  tasks: propTasks,
  isLoading: propIsLoading,
  sortByPriority = true,
  showCancelButtons = true,
  emptyMessage = "No tasks in queue",
}: TaskQueueProps) {
  const { tasks: hookTasks, isLoading: hookIsLoading } = useActiveTasks();

  const tasks = propTasks ?? hookTasks;
  const isLoading = propIsLoading ?? hookIsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ListX className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const sortedTasks = sortByPriority
    ? [...tasks].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      )
    : tasks;

  return (
    <div className="space-y-4">
      {sortedTasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          showCancelButton={showCancelButtons}
        />
      ))}
    </div>
  );
}
