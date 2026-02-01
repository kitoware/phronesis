"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageContainer, PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Link2 } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import type { ConvexProblem, ConvexResearchLink } from "@/types/convex";

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
  identified: "bg-gray-100 text-gray-800",
  researching: "bg-blue-100 text-blue-800",
  "solution-found": "bg-green-100 text-green-800",
  resolved: "bg-green-200 text-green-900",
  archived: "bg-gray-200 text-gray-600",
};

export default function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const problem = useQuery(api.problems.getById, { id: id as any }) as ConvexProblem | null | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const researchLinks = useQuery(api.researchLinks.getByProblem, { problemId: id as any }) as ConvexResearchLink[] | undefined;

  const isLoading = problem === undefined;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!problem) {
    return (
      <PageContainer>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Problem not found</h1>
          <p className="mt-2 text-muted-foreground">
            The problem you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/problems">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Problems
            </Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-4">
        <Button variant="ghost" asChild>
          <Link href="/problems">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Problems
          </Link>
        </Button>
      </div>

      <PageHeader
        title={problem.title}
        actions={
          <Button>
            <Link2 className="mr-2 h-4 w-4" />
            Find Research
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Badge variant="outline">{problem.category}</Badge>
        <Badge className={severityColors[problem.severity]}>
          {problem.severity}
        </Badge>
        <Badge className={statusColors[problem.status]}>{problem.status}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{problem.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              {problem.evidence.length === 0 ? (
                <p className="text-muted-foreground">No evidence collected.</p>
              ) : (
                <div className="space-y-4">
                  {problem.evidence.map((e: { source: string; excerpt: string; date?: string }, i: number) => (
                    <div key={i} className="border-l-2 border-muted pl-4">
                      <p className="text-sm">{e.excerpt}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Source: {e.source}
                        {e.date && ` • ${e.date}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Related Research</CardTitle>
            </CardHeader>
            <CardContent>
              {researchLinks === undefined ? (
                <Skeleton className="h-20 w-full" />
              ) : researchLinks.length === 0 ? (
                <p className="text-muted-foreground">
                  No research links found. Click &quot;Find Research&quot; to
                  discover relevant papers.
                </p>
              ) : (
                <div className="space-y-4">
                  {researchLinks.map((link: ConvexResearchLink) => (
                    <div key={link._id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{link.matchType}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {(link.relevanceScore * 100).toFixed(0)}% relevant
                        </span>
                      </div>
                      <p className="mt-2 text-sm">{link.matchRationale}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {problem.tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discovered</span>
                  <span>
                    {new Date(problem.discoveredAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>
                    {new Date(problem.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
