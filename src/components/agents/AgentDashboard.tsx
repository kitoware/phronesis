"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentStatusCard } from "./AgentStatusCard";
import { AgentMetrics, AgentDetailedStats } from "./AgentMetrics";
import { TaskQueue } from "./TaskQueue";
import { ApprovalQueue } from "./ApprovalQueue";
import { AgentRunHistory } from "./AgentRunHistory";
import type { AgentType } from "@/types/convex";
import { useApprovalCount } from "@/hooks/use-agent-approvals";
import { usePendingTaskCount } from "@/hooks/use-agent-tasks";

const agentTypes: AgentType[] = [
  "research-ingestion",
  "insight-generation",
  "trend-analysis",
  "problem-discovery",
  "research-linking",
  "solution-synthesis",
];

interface AgentDashboardProps {
  onAgentClick?: (agentType: AgentType) => void;
}

export function AgentDashboard({ onAgentClick }: AgentDashboardProps) {
  const { count: approvalCount } = useApprovalCount();
  const { count: pendingTaskCount } = usePendingTaskCount();

  return (
    <div className="space-y-6">
      <AgentMetrics />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agentTypes.map((agentType) => (
          <AgentStatusCard
            key={agentType}
            agentType={agentType}
            onClick={onAgentClick ? () => onAgentClick(agentType) : undefined}
          />
        ))}
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks" className="relative">
            Tasks
            {pendingTaskCount > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {pendingTaskCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approvals" className="relative">
            Approvals
            {approvalCount > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs text-white">
                {approvalCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskQueue />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalQueue />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentRunHistory limit={20} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <AgentDetailedStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
