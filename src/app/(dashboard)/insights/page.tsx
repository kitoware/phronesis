"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageContainer, PageHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConvexInsight } from "@/types/convex";

export default function InsightsPage() {
  const insights = useQuery(api.insights.list, { limit: 20 }) as ConvexInsight[] | undefined;
  const stats = useQuery(api.insights.getStats) as { total: number; avgKeyFindings: number } | undefined;

  const isLoading = insights === undefined;

  return (
    <PageContainer>
      <PageHeader
        title="Insights"
        description="AI-generated insights from research papers"
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Key Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avgKeyFindings?.toFixed(1) ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated Insights</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : insights.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No insights generated yet. Process papers to generate insights.
            </p>
          ) : (
            <div className="space-y-6">
              {insights.map((insight: ConvexInsight) => (
                <div
                  key={insight._id}
                  className="border-b pb-4 last:border-0 last:pb-0"
                >
                  <p className="mb-2">{insight.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {insight.keyFindings.slice(0, 3).map((finding: string, i: number) => (
                      <Badge key={i} variant="secondary">
                        {finding.length > 50
                          ? finding.slice(0, 50) + "..."
                          : finding}
                      </Badge>
                    ))}
                    {insight.keyFindings.length > 3 && (
                      <Badge variant="outline">
                        +{insight.keyFindings.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
