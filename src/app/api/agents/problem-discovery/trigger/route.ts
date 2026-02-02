import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { runProblemDiscovery } from "@/agents/problem-discovery";

export async function POST(_req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: "Convex URL not configured" },
        { status: 500 }
      );
    }

    const client = new ConvexHttpClient(convexUrl);

    const runId = await client.mutation(api.agentRuns.create, {
      agentType: "problem-discovery",
      triggeredBy: "manual",
      input: { triggeredBy: userId },
    });

    await client.mutation(api.agentRuns.start, { id: runId });

    try {
      const result = await runProblemDiscovery();

      await client.mutation(api.agentRuns.complete, {
        id: runId,
        output: {
          problemsCreated: result.problems,
          signalsDetected: result.signals,
          clustersFormed: result.clusters,
          errorsEncountered: result.errors,
        },
        metrics: {
          duration: result.duration,
          itemsProcessed: result.problems + result.signals + result.clusters,
          apiCalls: 0,
        },
      });

      return NextResponse.json({
        success: true,
        runId: runId.toString(),
        result,
      });
    } catch (error) {
      await client.mutation(api.agentRuns.fail, {
        id: runId,
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      });

      return NextResponse.json(
        {
          success: false,
          runId: runId.toString(),
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: "Convex URL not configured" },
        { status: 500 }
      );
    }

    const client = new ConvexHttpClient(convexUrl);

    const latestRun = await client.query(api.agentRuns.getLatestByType, {
      agentType: "problem-discovery",
    });

    if (!latestRun) {
      return NextResponse.json({
        status: "no_runs",
        message: "No problem discovery runs found",
      });
    }

    return NextResponse.json({
      status: latestRun.status,
      runId: latestRun._id.toString(),
      createdAt: latestRun.createdAt,
      startedAt: latestRun.startedAt,
      completedAt: latestRun.completedAt,
      output: latestRun.output,
      metrics: latestRun.metrics,
      error: latestRun.error,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
