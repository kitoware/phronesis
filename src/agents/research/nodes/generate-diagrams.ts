import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { ResearchAgentStateType } from "../state";
import { createLLMClient } from "../tools/llm";
import type { Diagram, ProcessedPaper, Insight, AgentError } from "../types";

const DiagramOutputSchema = z.object({
  architectureDiagram: z.object({
    title: z.string().describe("Title for the architecture diagram"),
    description: z.string().describe("Description of what the diagram shows"),
    mermaidCode: z
      .string()
      .describe("Mermaid flowchart code for the architecture"),
  }),
  mindmapDiagram: z.object({
    title: z.string().describe("Title for the concept mindmap"),
    description: z.string().describe("Description of the key concepts"),
    mermaidCode: z.string().describe("Mermaid mindmap code for concepts"),
  }),
});

type DiagramOutput = z.infer<typeof DiagramOutputSchema>;

const DIAGRAM_PROMPT = `You are an expert at creating Mermaid diagrams for academic papers.

Create two diagrams:
1. Architecture Flowchart: Show the system/method architecture using a flowchart
2. Concept Mindmap: Show key concepts and their relationships

Rules for Mermaid code:
- Use valid Mermaid syntax
- For flowcharts: Use 'graph TD' or 'graph LR'
- For mindmaps: Use 'mindmap' with proper indentation
- Keep node text concise (max 30 chars)
- Use proper escaping for special characters
- Don't include any markdown code fences in the mermaidCode field

Example flowchart:
graph TD
    A[Input Data] --> B[Preprocessing]
    B --> C[Model]
    C --> D[Output]

Example mindmap:
mindmap
    root((Main Concept))
        Branch1
            Leaf1
            Leaf2
        Branch2
            Leaf3`;

function validateMermaidSyntax(code: string): boolean {
  // Basic Mermaid syntax validation
  const validStarts = [
    "graph ",
    "flowchart ",
    "sequenceDiagram",
    "classDiagram",
    "stateDiagram",
    "erDiagram",
    "gantt",
    "pie",
    "mindmap",
    "timeline",
  ];

  const trimmedCode = code.trim();
  return validStarts.some((start) => trimmedCode.startsWith(start));
}

function cleanMermaidCode(code: string): string {
  // Remove markdown code fences if present
  const cleaned = code
    .replace(/^```mermaid\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return cleaned;
}

async function generateDiagramsForPaper(
  paper: ProcessedPaper,
  insight: Insight
): Promise<{ diagrams: Diagram[]; error?: string }> {
  const llm = createLLMClient();
  const structuredLlm = llm.withStructuredOutput(DiagramOutputSchema);

  const context = `Title: ${paper.title}

Abstract: ${paper.abstract}

Problem: ${insight.problemStatement || "Not specified"}

Solution: ${insight.proposedSolution || "Not specified"}

Technical Approach: ${insight.technicalApproach || "Not specified"}

Key Findings:
${insight.keyFindings.map((f, i) => `${i + 1}. ${f}`).join("\n")}`;

  try {
    const result = (await structuredLlm.invoke([
      new SystemMessage(DIAGRAM_PROMPT),
      new HumanMessage(context),
    ])) as DiagramOutput;

    const diagrams: Diagram[] = [];

    // Process architecture diagram
    const archCode = cleanMermaidCode(result.architectureDiagram.mermaidCode);
    if (validateMermaidSyntax(archCode)) {
      diagrams.push({
        type: "architecture",
        title: result.architectureDiagram.title,
        description: result.architectureDiagram.description,
        mermaidCode: archCode,
      });
    }

    // Process mindmap diagram
    const mindmapCode = cleanMermaidCode(result.mindmapDiagram.mermaidCode);
    if (validateMermaidSyntax(mindmapCode)) {
      diagrams.push({
        type: "mindmap",
        title: result.mindmapDiagram.title,
        description: result.mindmapDiagram.description,
        mermaidCode: mindmapCode,
      });
    }

    return { diagrams };
  } catch (error) {
    return {
      diagrams: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function generateDiagramsNode(
  state: ResearchAgentStateType
): Promise<Partial<ResearchAgentStateType>> {
  const { processedPapers, insights } = state;
  const errors: AgentError[] = [];
  const diagrams: Diagram[] = [];

  for (let i = 0; i < processedPapers.length; i++) {
    const paper = processedPapers[i];
    const insight = insights[i];

    if (!insight) {
      errors.push({
        stage: "generate-diagrams",
        message: `No insight available for paper ${paper.arxivId}`,
        paperId: paper.arxivId,
        timestamp: Date.now(),
      });
      continue;
    }

    const result = await generateDiagramsForPaper(paper, insight);

    if (result.error) {
      errors.push({
        stage: "generate-diagrams",
        message: `Failed to generate diagrams for ${paper.arxivId}: ${result.error}`,
        paperId: paper.arxivId,
        timestamp: Date.now(),
      });
    }

    diagrams.push(...result.diagrams);
  }

  return {
    diagrams,
    errors,
    status: "diagramming",
    progressMessage: `Generated ${diagrams.length} diagrams for ${processedPapers.length} papers`,
  };
}
