"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageContainer, PageHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConvexResearchLink } from "@/types/convex";

const matchTypeLabels: Record<string, string> = {
  direct: "Direct Match",
  methodology: "Methodology",
  tangential: "Tangential",
  inspiration: "Inspiration",
};

const reviewStatusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  "needs-review": "bg-yellow-100 text-yellow-800",
};

interface LinkStats {
  total: number;
  byMatchType: Record<string, number>;
  byReviewStatus: Record<string, number>;
  avgRelevance: number;
}

export default function LinksPage() {
  const links = useQuery(api.researchLinks.list, { limit: 50 }) as ConvexResearchLink[] | undefined;
  const stats = useQuery(api.researchLinks.getStats) as LinkStats | undefined;

  const isLoading = links === undefined;

  return (
    <PageContainer>
      <PageHeader
        title="Research Links"
        description="Connections between startup problems and academic research"
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Relevance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats?.avgRelevance ?? 0) * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.byReviewStatus?.pending ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.byReviewStatus?.accepted ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Research Links</CardTitle>
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
          ) : links.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No research links yet. Run the research linking agent to discover
              connections.
            </p>
          ) : (
            <div className="space-y-4">
              {links.map((link: ConvexResearchLink) => (
                <div
                  key={link._id}
                  className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {matchTypeLabels[link.matchType]}
                        </Badge>
                        <Badge className={reviewStatusColors[link.reviewStatus]}>
                          {link.reviewStatus}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm">{link.matchRationale}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {link.keyInsights.slice(0, 3).map((insight: string, i: number) => (
                          <Badge key={i} variant="secondary">
                            {insight.length > 40
                              ? insight.slice(0, 40) + "..."
                              : insight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {(link.relevanceScore * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        relevance
                      </div>
                    </div>
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
