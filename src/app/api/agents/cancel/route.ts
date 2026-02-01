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
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const convex = getConvexClient();
    const task = await convex.query(api.agentTasks.getById, {
      id: taskId as Id<"agentTasks">,
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const cancelableStatuses = ["queued", "running", "paused"];
    if (!cancelableStatuses.includes(task.status)) {
      return NextResponse.json(
        { error: `Cannot cancel a task that is ${task.status}` },
        { status: 400 }
      );
    }

    await convex.mutation(api.agentTasks.cancel, {
      id: taskId as Id<"agentTasks">,
    });

    return NextResponse.json({
      success: true,
      message: "Task cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling task:", error);
    return NextResponse.json(
      { error: "Failed to cancel task" },
      { status: 500 }
    );
  }
}
