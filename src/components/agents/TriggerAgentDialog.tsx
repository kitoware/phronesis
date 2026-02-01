"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTriggerTask } from "@/hooks/use-agent-tasks";
import type { AgentType, TaskPriority } from "@/types/convex";
import { Play, Loader2 } from "lucide-react";

const agentTypeOptions: { value: AgentType; label: string }[] = [
  { value: "research-ingestion", label: "Research Ingestion" },
  { value: "insight-generation", label: "Insight Generation" },
  { value: "trend-analysis", label: "Trend Analysis" },
  { value: "problem-discovery", label: "Problem Discovery" },
  { value: "research-linking", label: "Research Linking" },
  { value: "solution-synthesis", label: "Solution Synthesis" },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

interface TriggerAgentDialogProps {
  trigger?: React.ReactNode;
  defaultAgentType?: AgentType;
  onSuccess?: () => void;
}

export function TriggerAgentDialog({
  trigger,
  defaultAgentType,
  onSuccess,
}: TriggerAgentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agentType, setAgentType] = useState<AgentType>(
    defaultAgentType ?? "research-ingestion"
  );
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const triggerTask = useTriggerTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const taskTitle =
        title.trim() ||
        `Manual ${agentTypeOptions.find((o) => o.value === agentType)?.label} Run`;

      await triggerTask({
        agentType,
        title: taskTitle,
        description: description.trim() || undefined,
        priority,
        triggeredBy: "manual",
      });

      setOpen(false);
      setTitle("");
      setDescription("");
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Trigger Agent
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Trigger Agent Task</DialogTitle>
            <DialogDescription>
              Manually trigger an agent to run a task. The task will be added to
              the queue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="agentType">Agent Type</Label>
              <Select
                value={agentType}
                onValueChange={(value) => setAgentType(value as AgentType)}
              >
                <SelectTrigger id="agentType">
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent>
                  {agentTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="Custom task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional context for this run"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Triggering...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Trigger
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
