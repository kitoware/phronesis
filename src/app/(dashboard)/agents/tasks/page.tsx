"use client";

import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TriggerAgentDialog, TaskQueue } from "@/components/agents";
import { useAgentTasks, useTaskStats } from "@/hooks/use-agent-tasks";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskStatus } from "@/types/convex";

export default function AgentTasksPage() {
  const [activeTab, setActiveTab] = useState<TaskStatus | "all">("all");
  const { stats, isLoading: statsLoading } = useTaskStats();

  const { tasks: allTasks, isLoading: allLoading } = useAgentTasks({
    limit: 50,
  });
  const { tasks: queuedTasks, isLoading: queuedLoading } = useAgentTasks({
    status: "queued",
    limit: 50,
  });
  const { tasks: runningTasks, isLoading: runningLoading } = useAgentTasks({
    status: "running",
    limit: 50,
  });
  const { tasks: completedTasks, isLoading: completedLoading } = useAgentTasks({
    status: "completed",
    limit: 50,
  });
  const { tasks: failedTasks, isLoading: failedLoading } = useAgentTasks({
    status: "failed",
    limit: 50,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Agent Tasks"
        description="View and manage agent task queue"
        actions={<TriggerAgentDialog />}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Queued</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {stats?.byStatus?.queued ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {stats?.byStatus?.running ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.byStatus?.completed ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {stats?.byStatus?.failed ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TaskStatus | "all")}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="queued">Queued</TabsTrigger>
              <TabsTrigger value="running">Running</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <TaskQueue
                tasks={allTasks}
                isLoading={allLoading}
                emptyMessage="No tasks found"
              />
            </TabsContent>
            <TabsContent value="queued">
              <TaskQueue
                tasks={queuedTasks}
                isLoading={queuedLoading}
                emptyMessage="No queued tasks"
              />
            </TabsContent>
            <TabsContent value="running">
              <TaskQueue
                tasks={runningTasks}
                isLoading={runningLoading}
                emptyMessage="No running tasks"
              />
            </TabsContent>
            <TabsContent value="completed">
              <TaskQueue
                tasks={completedTasks}
                isLoading={completedLoading}
                showCancelButtons={false}
                emptyMessage="No completed tasks"
              />
            </TabsContent>
            <TabsContent value="failed">
              <TaskQueue
                tasks={failedTasks}
                isLoading={failedLoading}
                showCancelButtons={false}
                emptyMessage="No failed tasks"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
