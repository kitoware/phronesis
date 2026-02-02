/**
 * Test script for the Research Discovery Agent.
 *
 * Run with: npx tsx src/agents/research/test-agent.ts
 *
 * Required environment variables:
 * - OPENROUTER_API_KEY: For LLM and embeddings
 * - NEXT_PUBLIC_CONVEX_URL: For database operations
 * - PDF_EXTRACTOR_URL: Optional, defaults to http://localhost:8000
 */

import { researchAgentGraph, runResearchAgent } from "./index";

async function testGraphCompilation() {
  console.log("Testing graph compilation...");

  // Verify the graph is compiled
  if (!researchAgentGraph) {
    throw new Error("Graph failed to compile");
  }

  console.log("Graph compiled successfully!");
  console.log("Graph nodes:", Object.keys(researchAgentGraph.nodes || {}));
}

async function testArxivFetch() {
  console.log("\nTesting arXiv fetch...");

  const { fetchArxivPapers } = await import("./tools/arxiv");

  const papers = await fetchArxivPapers({
    categories: ["cs.AI"],
    maxResults: 3,
    daysBack: 30,
  });

  console.log(`Fetched ${papers.length} papers from arXiv`);

  if (papers.length > 0) {
    console.log("First paper:", {
      arxivId: papers[0].arxivId,
      title: papers[0].title.substring(0, 80) + "...",
      primaryCategory: papers[0].primaryCategory,
    });
  }

  return papers;
}

async function testPdfService() {
  console.log("\nTesting PDF extraction service...");

  const { checkPdfServiceHealth } = await import("./tools/pdf");

  const isHealthy = await checkPdfServiceHealth();
  console.log(`PDF service health: ${isHealthy ? "healthy" : "not available"}`);

  return isHealthy;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--full")) {
    // Run full agent
    console.log("Running full research agent...\n");

    const result = await runResearchAgent({
      categories: ["cs.AI"],
      maxPapers: 3,
      daysBack: 30,
    });

    console.log("\nFinal state:", {
      fetchedPapers: result.fetchedPapers.length,
      processedPapers: result.processedPapers.length,
      insights: result.insights.length,
      diagrams: result.diagrams.length,
      errors: result.errors.length,
      savedPaperIds: result.savedPaperIds.length,
      savedInsightIds: result.savedInsightIds.length,
      savedDiagramIds: result.savedDiagramIds.length,
    });
  } else {
    // Run individual tests
    await testGraphCompilation();
    await testArxivFetch();
    await testPdfService();

    console.log("\n=== All tests passed ===");
    console.log(
      "\nTo run the full agent pipeline, use: npx tsx src/agents/research/test-agent.ts --full"
    );
  }
}

main().catch(console.error);
