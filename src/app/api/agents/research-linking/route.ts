import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createConvexClient,
  api,
  type Id,
} from "@/lib/agents/shared/convex-client";
import { createResearchLinkingGraph } from "@/lib/agents/research-linking/graph";
import type { ResearchLinkingOutput } from "@/lib/agents/research-linking/state";

const TriggerSchema = z.object({
  problemId: z.string().min(1, "problemId is required"),
});

/**
 * POST /api/agents/research-linking
 *
 * Triggers the Research-Linking agent for a given problem.
 * Creates an agentRuns record and runs the graph until save_links.
 * Returns with status "awaiting-approval" for human review.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ResearchLinkingOutput>> {
  try {
    const body = await request.json();
    const parsed = TriggerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          runId: "",
          status: "failed",
          linksCreated: 0,
          error: parsed.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { problemId } = parsed.data;
    const client = createConvexClient();

    // Verify problem exists
    const problem = await client.query(api.problems.getById, {
      id: problemId as Id<"startupProblems">,
    });

    if (!problem) {
      return NextResponse.json(
        {
          runId: "",
          status: "failed",
          linksCreated: 0,
          error: "Problem not found",
        },
        { status: 404 }
      );
    }

    // Create agent run record
    const runId = await client.mutation(api.agentRuns.create, {
      agentType: "research-linking",
      triggeredBy: "manual",
      input: { problemId },
    });

    // Create and run the graph
    const graph = createResearchLinkingGraph();

    const initialState = {
      problemId: problemId as Id<"startupProblems">,
      runId,
    };

    const finalState = await graph.invoke(initialState);

    // Check for errors
    if (finalState.error) {
      await client.mutation(api.agentRuns.fail, {
        id: runId,
        error: {
          message: finalState.error,
        },
      });

      return NextResponse.json(
        {
          runId,
          status: "failed",
          linksCreated: 0,
          error: finalState.error,
        },
        { status: 500 }
      );
    }

    // Return success with awaiting-approval status
    return NextResponse.json({
      runId,
      status: "awaiting-approval",
      linksCreated: finalState.createdLinkIds?.length ?? 0,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        runId: "",
        status: "failed",
        linksCreated: 0,
        error: message,
      },
      { status: 500 }
    );
  }
}
