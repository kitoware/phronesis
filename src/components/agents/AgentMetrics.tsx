"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgentRunStats } from "@/hooks/use-agents";
import { useTaskStats } from "@/hooks/use-agent-tasks";
import { useApprovalStats } from "@/hooks/use-agent-approvals";
import { Activity, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export function AgentMetrics() {
  const { stats: runStats, isLoading: runsLoading } = useAgentRunStats();
  const { stats: taskStats, isLoading: tasksLoading } = useTaskStats();
  const { stats: approvalStats, isLoading: approvalsLoading } =
    useApprovalStats();

  const isLoading = runsLoading || tasksLoading || approvalsLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Runs",
      value: runStats?.total ?? 0,
      icon: Activity,
      description: "All-time agent executions",
    },
    {
      title: "Queued Tasks",
      value: taskStats?.byStatus?.queued ?? 0,
      icon: Clock,
      description: "Tasks waiting to run",
    },
    {
      title: "Completed Today",
      value: runStats?.byStatus?.completed ?? 0,
      icon: CheckCircle,
      description: "Successfully completed",
      className: "text-green-600",
    },
    {
      title: "Pending Approvals",
      value: approvalStats?.byStatus?.pending ?? 0,
      icon: AlertTriangle,
      description: "Awaiting review",
      className: "text-yellow-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.className ?? ""}`}>
                {metric.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function AgentDetailedStats() {
  const { stats: runStats, isLoading } = useAgentRunStats();

  if (isLoading || !runStats) {
    return <Skeleton className="h-48 w-full" />;
  }

  const failureRate =
    runStats.total > 0
      ? ((runStats.byStatus?.failed ?? 0) / runStats.total) * 100
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {runStats.total > 0 ? (100 - failureRate).toFixed(1) : "N/A"}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {runStats.avgDuration > 0
              ? `${(runStats.avgDuration / 1000).toFixed(1)}s`
              : "N/A"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Failed Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {runStats.byStatus?.failed ?? 0}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
