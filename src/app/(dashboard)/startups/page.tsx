"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageContainer, PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ExternalLink } from "lucide-react";

const fundingStageLabels: Record<string, string> = {
  "pre-seed": "Pre-Seed",
  seed: "Seed",
  "series-a": "Series A",
  "series-b": "Series B",
  "series-c": "Series C",
  "series-d+": "Series D+",
  public: "Public",
  acquired: "Acquired",
};

export default function StartupsPage() {
  const startups = useQuery(api.startups.list, { limit: 20 });
  const stats = useQuery(api.startups.getStats);

  const isLoading = startups === undefined;

  return (
    <PageContainer>
      <PageHeader
        title="Startups"
        description="Track startups and discover their problems"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Startup
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Startups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pre-Seed/Seed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.byStage?.["pre-seed"] ?? 0) +
                (stats?.byStage?.seed ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Series A-C</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.byStage?.["series-a"] ?? 0) +
                (stats?.byStage?.["series-b"] ?? 0) +
                (stats?.byStage?.["series-c"] ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Late Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.byStage?.["series-d+"] ?? 0) +
                (stats?.byStage?.public ?? 0) +
                (stats?.byStage?.acquired ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Startup List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : startups.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No startups tracked yet. Add startups to begin problem discovery.
            </p>
          ) : (
            <div className="space-y-4">
              {startups.map((startup) => (
                <div
                  key={startup._id}
                  className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{startup.name}</h3>
                      {startup.website && (
                        <a
                          href={startup.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {startup.description}
                    </p>
                    <div className="flex items-center gap-2">
                      {startup.fundingStage && (
                        <Badge variant="outline">
                          {fundingStageLabels[startup.fundingStage]}
                        </Badge>
                      )}
                      {startup.industries.slice(0, 2).map((industry) => (
                        <Badge key={industry} variant="secondary">
                          {industry}
                        </Badge>
                      ))}
                      {startup.industries.length > 2 && (
                        <Badge variant="secondary">
                          +{startup.industries.length - 2}
                        </Badge>
                      )}
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
