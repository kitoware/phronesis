"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AgentTypeBadge } from "./AgentTypeBadge";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import type { ConvexAgentTask } from "@/types/convex";
import { useCancelTask } from "@/hooks/use-agent-tasks";
import { X, Clock, Play, Pause, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusIcons: Record<string, React.ElementType> = {
  queued: Clock,
  running: Play,
  paused: Pause,
  completed: CheckCircle,
  failed: XCircle,
  cancelled: X,
};

const statusLabels: Record<string, string> = {
  queued: "Queued",
  running: "Running",
  paused: "Paused",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

interface TaskCardProps {
  task: ConvexAgentTask;
  showCancelButton?: boolean;
}

export function TaskCard({ task, showCancelButton = true }: TaskCardProps) {
  const cancelTask = useCancelTask();
  const StatusIcon = statusIcons[task.status] ?? Clock;

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await cancelTask(task._id);
  };

  const isActive = task.status === "queued" || task.status === "running";

  return (
    <Card className={`${isActive ? "border-primary/50" : ""}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">{task.title}</h3>
            </div>

            {task.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <AgentTypeBadge agentType={task.agentType} size="sm" />
              <TaskPriorityBadge priority={task.priority} size="sm" />
              <Badge variant="outline" className="text-xs">
                {statusLabels[task.status]}
              </Badge>
            </div>

            {task.status === "running" && task.progress !== undefined && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-2" />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Created {formatDistanceToNow(new Date(task.createdAt))} ago
              {task.startedAt &&
                ` | Started ${formatDistanceToNow(new Date(task.startedAt))} ago`}
            </p>
          </div>

          {showCancelButton && isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
