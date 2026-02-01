"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageContainer, PageHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function TrendsPage() {
  const trends = useQuery(api.trends.list, { limit: 20 });
  const categories = useQuery(api.trends.getCategories);

  const isLoading = trends === undefined;

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "rising":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Trends"
        description="Research trends and analytics across categories"
      />

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {categories === undefined ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-6 w-20" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories tracked yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge key={category} variant="outline">
                    {category}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : trends.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No trends analyzed yet. Run trend analysis to see insights.
            </p>
          ) : (
            <div className="space-y-4">
              {trends.map((trend) => (
                <div
                  key={trend._id}
                  className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{trend.topic}</h3>
                      {getTrendIcon(trend.forecast?.trend)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {trend.category} • {trend.period}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{trend.metrics.paperCount} papers</span>
                      <span>{trend.metrics.authorCount} authors</span>
                      {trend.metrics.growthRate !== undefined && (
                        <span
                          className={
                            trend.metrics.growthRate > 0
                              ? "text-green-500"
                              : trend.metrics.growthRate < 0
                                ? "text-red-500"
                                : ""
                          }
                        >
                          {trend.metrics.growthRate > 0 ? "+" : ""}
                          {trend.metrics.growthRate.toFixed(1)}% growth
                        </span>
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
