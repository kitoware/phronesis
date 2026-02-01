"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageContainer, PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ExternalLink } from "lucide-react";

export default function ResearchPage() {
  const papers = useQuery(api.papers.list, { limit: 20 });
  const stats = useQuery(api.papers.getStats);

  const isLoading = papers === undefined;

  return (
    <PageContainer>
      <PageHeader
        title="Research"
        description="Browse and manage ArXiv papers"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Import Papers
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Papers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.processing ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Papers</CardTitle>
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
          ) : papers.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No papers yet. Import papers from ArXiv to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {papers.map((paper) => (
                <div
                  key={paper._id}
                  className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <h3 className="font-medium">{paper.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {paper.authors.map((a) => a.name).join(", ")}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{paper.primaryCategory}</Badge>
                      <Badge
                        variant={
                          paper.processingStatus === "completed"
                            ? "default"
                            : paper.processingStatus === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {paper.processingStatus}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
