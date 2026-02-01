"use client";

import { PageContainer, PageHeader } from "@/components/layout";
import { AgentDashboard, TriggerAgentDialog } from "@/components/agents";

export default function AgentsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Agent Dashboard"
        description="Monitor and manage AI agent activities"
        actions={<TriggerAgentDialog />}
      />

      <AgentDashboard />
    </PageContainer>
  );
}
