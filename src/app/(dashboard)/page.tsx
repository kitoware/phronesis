"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageContainer, PageHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Lightbulb,
  AlertCircle,
  Building2,
  Link2,
} from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const paperStats = useQuery(api.papers.getStats);
  const insightStats = useQuery(api.insights.getStats);
  const problemStats = useQuery(api.problems.getStats);
  const startupStats = useQuery(api.startups.getStats);
  const linkStats = useQuery(api.researchLinks.getStats);

  const isLoading =
    paperStats === undefined ||
    insightStats === undefined ||
    problemStats === undefined ||
    startupStats === undefined ||
    linkStats === undefined;

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of your research intelligence platform"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Papers"
          value={paperStats?.total ?? 0}
          icon={FileText}
          loading={isLoading}
        />
        <StatCard
          title="Papers Processed"
          value={paperStats?.completed ?? 0}
          icon={FileText}
          loading={isLoading}
        />
        <StatCard
          title="Insights Generated"
          value={insightStats?.total ?? 0}
          icon={Lightbulb}
          loading={isLoading}
        />
        <StatCard
          title="Problems Identified"
          value={problemStats?.total ?? 0}
          icon={AlertCircle}
          loading={isLoading}
        />
        <StatCard
          title="Startups Tracked"
          value={startupStats?.total ?? 0}
          icon={Building2}
          loading={isLoading}
        />
        <StatCard
          title="Research Links"
          value={linkStats?.total ?? 0}
          icon={Link2}
          loading={isLoading}
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to display.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Quick actions will be available here.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
