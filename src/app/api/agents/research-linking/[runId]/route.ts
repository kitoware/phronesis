import { NextRequest, NextResponse } from "next/server";
import {
  createConvexClient,
  api,
  type Id,
} from "@/lib/agents/shared/convex-client";
import { createReportGenerationGraph } from "@/lib/agents/research-linking/graph";
import type { ResearchLinkingOutput } from "@/lib/agents/research-linking/state";

interface RouteParams {
  params: Promise<{ runId: string }>;
}

/**
 * GET /api/agents/research-linking/[runId]
 *
 * Returns the current status of an agent run.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { runId } = await params;
    const client = createConvexClient();

    const run = await client.query(api.agentRuns.getById, {
      id: runId as Id<"agentRuns">,
    });

    if (!run) {
      return NextResponse.json(
        { error: "Agent run not found" },
        { status: 404 }
      );
    }

    // If the run has output, extract status info
    const output = run.output as {
      status?: string;
      linksCreated?: number;
      linkIds?: string[];
      reportId?: string;
    } | null;

    // Fetch links for this problem if available
    const problemId = (run.input as { problemId?: string })?.problemId;
    let links: Awaited<
      ReturnType<typeof client.query<typeof api.researchLinks.getByProblem>>
    > = [];

    if (problemId) {
      links = await client.query(api.researchLinks.getByProblem, {
        problemId: problemId as Id<"startupProblems">,
      });
    }

    return NextResponse.json({
      runId,
      agentType: run.agentType,
      status: run.status,
      outputStatus: output?.status,
      linksCreated: output?.linksCreated ?? 0,
      reportId: output?.reportId,
      links: links.map((link) => ({
        id: link._id,
        paperId: link.paperId,
        relevanceScore: link.relevanceScore,
        matchType: link.matchType,
        reviewStatus: link.reviewStatus,
      })),
      createdAt: run.createdAt,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      error: run.error,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/agents/research-linking/[runId]
 *
 * Resumes an agent run after human approval of research links.
 * Generates the solution report from approved links.
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ResearchLinkingOutput>> {
  try {
    const { runId } = await params;
    const client = createConvexClient();

    // Fetch the agent run
    const run = await client.query(api.agentRuns.getById, {
      id: runId as Id<"agentRuns">,
    });

    if (!run) {
      return NextResponse.json(
        {
          runId,
          status: "failed",
          linksCreated: 0,
          error: "Agent run not found",
        },
        { status: 404 }
      );
    }

    // Verify the run is in a resumable state
    const output = run.output as {
      status?: string;
      linksCreated?: number;
      linkIds?: string[];
    } | null;

    if (output?.status !== "awaiting-approval") {
      return NextResponse.json(
        {
          runId,
          status: "failed",
          linksCreated: output?.linksCreated ?? 0,
          error: "Agent run is not awaiting approval",
        },
        { status: 400 }
      );
    }

    const problemId = (run.input as { problemId: string }).problemId;

    // Fetch approved links
    const allLinks = await client.query(api.researchLinks.getByProblem, {
      problemId: problemId as Id<"startupProblems">,
    });

    const approvedLinks = allLinks.filter(
      (link) => link.reviewStatus === "accepted"
    );

    if (approvedLinks.length === 0) {
      return NextResponse.json(
        {
          runId,
          status: "failed",
          linksCreated: output?.linksCreated ?? 0,
          error:
            "No approved links found. Please approve at least one research link.",
        },
        { status: 400 }
      );
    }

    // Fetch the problem
    const problem = await client.query(api.problems.getById, {
      id: problemId as Id<"startupProblems">,
    });

    if (!problem) {
      return NextResponse.json(
        {
          runId,
          status: "failed",
          linksCreated: output?.linksCreated ?? 0,
          error: "Problem not found",
        },
        { status: 404 }
      );
    }

    // Create and run the report generation graph
    const graph = createReportGenerationGraph();

    const resumeState = {
      problemId: problemId as Id<"startupProblems">,
      runId: runId as Id<"agentRuns">,
      problem,
      createdLinkIds: (output?.linkIds ?? []) as Id<"researchLinks">[],
      approvedLinkIds: approvedLinks.map((l) => l._id),
      needsApproval: false,
    };

    const finalState = await graph.invoke(resumeState);

    // Check for errors
    if (finalState.error) {
      await client.mutation(api.agentRuns.fail, {
        id: runId as Id<"agentRuns">,
        error: {
          message: finalState.error,
        },
      });

      return NextResponse.json(
        {
          runId,
          status: "failed",
          linksCreated: output?.linksCreated ?? 0,
          error: finalState.error,
        },
        { status: 500 }
      );
    }

    // Return success
    return NextResponse.json({
      runId,
      status: "completed",
      linksCreated: output?.linksCreated ?? 0,
      reportId: finalState.reportId ?? undefined,
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
