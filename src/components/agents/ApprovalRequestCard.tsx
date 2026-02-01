"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AgentTypeBadge } from "./AgentTypeBadge";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import type { ConvexAgentApproval } from "@/types/convex";
import {
  useApproveRequest,
  useRejectRequest,
} from "@/hooks/use-agent-approvals";
import { Check, X, Clock, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const categoryLabels: Record<string, string> = {
  "content-publish": "Content Publish",
  "data-modification": "Data Modification",
  "external-api": "External API",
  "resource-intensive": "Resource Intensive",
  "security-sensitive": "Security Sensitive",
  other: "Other",
};

interface ApprovalRequestCardProps {
  approval: ConvexAgentApproval;
  showActions?: boolean;
  onActionComplete?: () => void;
}

export function ApprovalRequestCard({
  approval,
  showActions = true,
  onActionComplete,
}: ApprovalRequestCardProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await approveRequest(approval._id, { reviewNotes: notes || undefined });
      onActionComplete?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await rejectRequest(approval._id, { reviewNotes: notes || undefined });
      onActionComplete?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = approval.status === "pending";
  const isExpiringSoon =
    approval.expiresAt && approval.expiresAt - Date.now() < 3600000;

  return (
    <Card className={`${isPending ? "border-yellow-500/50" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{approval.title}</CardTitle>
          <div className="flex items-center gap-2">
            <TaskPriorityBadge priority={approval.priority} size="sm" />
            {isPending && isExpiringSoon && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Expiring Soon
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{approval.description}</p>

        <div className="flex flex-wrap items-center gap-2">
          <AgentTypeBadge agentType={approval.agentType} size="sm" />
          <Badge variant="outline" className="text-xs">
            {categoryLabels[approval.category] || approval.category}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${
              approval.status === "approved"
                ? "bg-green-100 text-green-800"
                : approval.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : approval.status === "expired"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          Requested {formatDistanceToNow(new Date(approval.requestedAt))} ago
        </div>

        {approval.data !== undefined && approval.data !== null && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              View Data
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(
                approval.data as Record<string, unknown>,
                null,
                2
              )}
            </pre>
          </details>
        )}

        {showActions && isPending && (
          <div className="space-y-3 pt-2">
            <Textarea
              placeholder="Add notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1"
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        )}

        {approval.reviewedAt && (
          <div className="border-t pt-3 text-xs text-muted-foreground">
            <p>
              Reviewed {formatDistanceToNow(new Date(approval.reviewedAt))} ago
            </p>
            {approval.reviewNotes && (
              <p className="mt-1 italic">{approval.reviewNotes}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
