/**
 * API Route: Trigger Trend Analysis Agent
 * POST /api/agents/trend-analysis/trigger
 *
 * Starts a new trend analysis run with the specified parameters
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { v4 as uuidv4 } from "uuid";
import { createTrendAnalysisGraph } from "@/agents/trend-analysis/graph";

// Dynamically import api to avoid type generation timing issues
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const api: any = require("../../../../../../convex/_generated/api").api;

// Request body schema
interface TriggerRequest {
  category?: string;
  period?: "daily" | "weekly" | "monthly";
}

// Response schema
interface TriggerResponse {
  taskId: string;
  message: string;
}

interface ErrorResponse {
  error: string;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<TriggerResponse | ErrorResponse>> {
  try {
    // Authenticate the request
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body: TriggerRequest = await req.json();
    const category = body.category || "cs.AI";
    const period = body.period || "weekly";

    // Validate period
    if (!["daily", "weekly", "monthly"].includes(period)) {
      return NextResponse.json(
        { error: "Invalid period. Must be 'daily', 'weekly', or 'monthly'" },
        { status: 400 }
      );
    }

    // Initialize Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: "Convex URL not configured" },
        { status: 500 }
      );
    }

    const convexClient = new ConvexHttpClient(convexUrl);

    // Generate unique task ID
    const taskId = uuidv4();

    // Create task record in Convex
    await convexClient.mutation(api.agentTasks?.create, {
      taskId,
      agentType: "trend_analysis",
      status: "running",
      priority: "medium",
      payload: { category, period, triggeredBy: userId },
    });

    // Create the graph with checkpointing
    const graph = createTrendAnalysisGraph(convexClient);

    // Run graph in background (fire and forget)
    // The graph will update the task status when complete
    runGraphInBackground(graph, convexClient, taskId, category, period);

    return NextResponse.json({
      taskId,
      message: `Trend analysis agent started for ${category} (${period})`,
    });
  } catch (error) {
    console.error("[trend-analysis/trigger] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Run the graph in the background and update task status
 */
async function runGraphInBackground(
  graph: ReturnType<typeof createTrendAnalysisGraph>,
  convexClient: ConvexHttpClient,
  taskId: string,
  category: string,
  period: "daily" | "weekly" | "monthly"
): Promise<void> {
  try {
    // Run the graph to completion (invoke returns final state)
    const finalState = await graph.invoke(
      { category, period },
      { configurable: { thread_id: taskId } }
    );

    // Update task as completed
    await convexClient.mutation(api.agentTasks?.update, {
      taskId,
      status: "completed",
      result: {
        trendsFound: finalState?.trends?.length ?? 0,
        forecastsGenerated: finalState?.forecasts?.length ?? 0,
        savedTrendIds: finalState?.savedTrendIds ?? [],
      },
      completedAt: Date.now(),
    });

    console.log(`[trend-analysis] Task ${taskId} completed successfully`);
  } catch (error) {
    console.error(`[trend-analysis] Task ${taskId} failed:`, error);

    // Update task as failed
    await convexClient.mutation(api.agentTasks?.update, {
      taskId,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      completedAt: Date.now(),
    });
  }
}

/**
 * GET handler to check task status
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<{ status: string; result?: unknown } | ErrorResponse>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = req.nextUrl.searchParams.get("taskId");
    if (!taskId) {
      return NextResponse.json(
        { error: "taskId query parameter is required" },
        { status: 400 }
      );
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: "Convex URL not configured" },
        { status: 500 }
      );
    }

    const convexClient = new ConvexHttpClient(convexUrl);

    const task = await convexClient.query(api.agentTasks?.get, { taskId });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: task.status,
      result: task.result,
    });
  } catch (error) {
    console.error("[trend-analysis/trigger] GET Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
