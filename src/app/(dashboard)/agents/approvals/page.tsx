"use client";

import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalQueue } from "@/components/agents";
import {
  useAgentApprovals,
  useApprovalStats,
} from "@/hooks/use-agent-approvals";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApprovalStatus } from "@/types/convex";

export default function AgentApprovalsPage() {
  const [activeTab, setActiveTab] = useState<ApprovalStatus | "all">("pending");
  const { stats, isLoading: statsLoading } = useApprovalStats();

  const { approvals: allApprovals, isLoading: allLoading } = useAgentApprovals({
    limit: 50,
  });
  const { approvals: pendingApprovals, isLoading: pendingLoading } =
    useAgentApprovals({ status: "pending", limit: 50 });
  const { approvals: approvedApprovals, isLoading: approvedLoading } =
    useAgentApprovals({ status: "approved", limit: 50 });
  const { approvals: rejectedApprovals, isLoading: rejectedLoading } =
    useAgentApprovals({ status: "rejected", limit: 50 });

  return (
    <PageContainer>
      <PageHeader
        title="Agent Approvals"
        description="Review and approve agent requests requiring human oversight"
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.byStatus?.pending ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {stats?.byStatus?.approved ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {stats?.byStatus?.rejected ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-gray-600">
                {stats?.byStatus?.expired ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ApprovalStatus | "all")}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="relative">
                Pending
                {(stats?.byStatus?.pending ?? 0) > 0 && (
                  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs text-white">
                    {stats?.byStatus?.pending}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <ApprovalQueue
                approvals={pendingApprovals}
                isLoading={pendingLoading}
                emptyMessage="No pending approvals. All caught up!"
              />
            </TabsContent>
            <TabsContent value="all">
              <ApprovalQueue
                approvals={allApprovals}
                isLoading={allLoading}
                showActions={false}
                emptyMessage="No approval requests found"
              />
            </TabsContent>
            <TabsContent value="approved">
              <ApprovalQueue
                approvals={approvedApprovals}
                isLoading={approvedLoading}
                showActions={false}
                emptyMessage="No approved requests"
              />
            </TabsContent>
            <TabsContent value="rejected">
              <ApprovalQueue
                approvals={rejectedApprovals}
                isLoading={rejectedLoading}
                showActions={false}
                emptyMessage="No rejected requests"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
