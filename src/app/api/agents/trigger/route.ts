import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return new ConvexHttpClient(url);
}

const validAgentTypes = [
  "research-ingestion",
  "insight-generation",
  "trend-analysis",
  "problem-discovery",
  "research-linking",
  "solution-synthesis",
] as const;

const validPriorities = ["critical", "high", "medium", "low"] as const;

type AgentType = (typeof validAgentTypes)[number];
type Priority = (typeof validPriorities)[number];

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { agentType, title, description, priority, payload } = body;

    if (!agentType || !validAgentTypes.includes(agentType)) {
      return NextResponse.json(
        { error: "Invalid agent type" },
        { status: 400 }
      );
    }

    const taskPriority: Priority = validPriorities.includes(priority)
      ? priority
      : "medium";

    const taskTitle =
      title ||
      `Manual ${agentType
        .split("-")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")} Run`;

    const convex = getConvexClient();
    const taskId = await convex.mutation(api.agentTasks.create, {
      agentType: agentType as AgentType,
      title: taskTitle,
      description: description || undefined,
      priority: taskPriority,
      triggeredBy: "manual",
      payload: payload || undefined,
    });

    return NextResponse.json({
      success: true,
      taskId,
      message: `Task created successfully`,
    });
  } catch (error) {
    console.error("Error triggering agent:", error);
    return NextResponse.json(
      { error: "Failed to trigger agent" },
      { status: 500 }
    );
  }
}
