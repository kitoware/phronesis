import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return new ConvexHttpClient(url);
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { approvalId, action, reviewNotes } = body;

    if (!approvalId) {
      return NextResponse.json(
        { error: "Approval ID is required" },
        { status: 400 }
      );
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const convex = getConvexClient();
    const approval = await convex.query(api.agentApprovals.getById, {
      id: approvalId as Id<"agentApprovals">,
    });

    if (!approval) {
      return NextResponse.json(
        { error: "Approval request not found" },
        { status: 404 }
      );
    }

    if (approval.status !== "pending") {
      return NextResponse.json(
        {
          error: `Cannot ${action} a request that is already ${approval.status}`,
        },
        { status: 400 }
      );
    }

    if (action === "approve") {
      await convex.mutation(api.agentApprovals.approve, {
        id: approvalId as Id<"agentApprovals">,
        reviewNotes: reviewNotes || undefined,
      });
    } else {
      await convex.mutation(api.agentApprovals.reject, {
        id: approvalId as Id<"agentApprovals">,
        reviewNotes: reviewNotes || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Request ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error processing approval:", error);
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
  }
}
