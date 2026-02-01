"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageContainer, PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import Link from "next/link";

const severityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const statusColors = {
  identified: "bg-gray-100 text-gray-800",
  researching: "bg-blue-100 text-blue-800",
  "solution-found": "bg-green-100 text-green-800",
  resolved: "bg-green-200 text-green-900",
  archived: "bg-gray-200 text-gray-600",
};

export default function ProblemsPage() {
  const problems = useQuery(api.problems.list, { limit: 20 });
  const stats = useQuery(api.problems.getStats);

  const isLoading = problems === undefined;

  return (
    <PageContainer>
      <PageHeader
        title="Problems"
        description="Startup problems identified for research matching"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Problem
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.bySeverity?.critical ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Researching</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.byStatus?.researching ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Solved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(stats?.byStatus?.["solution-found"] ?? 0) +
                (stats?.byStatus?.resolved ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Problem List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : problems.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No problems identified yet. Add problems or run discovery.
            </p>
          ) : (
            <div className="space-y-4">
              {problems.map((problem) => (
                <Link
                  key={problem._id}
                  href={`/problems/${problem._id}`}
                  className="block"
                >
                  <div className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="space-y-1">
                      <h3 className="font-medium">{problem.title}</h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {problem.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{problem.category}</Badge>
                        <Badge className={severityColors[problem.severity]}>
                          {problem.severity}
                        </Badge>
                        <Badge className={statusColors[problem.status]}>
                          {problem.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
