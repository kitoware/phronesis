import { Annotation } from "@langchain/langgraph";
import type {
  ArxivPaper,
  ProcessedPaper,
  Insight,
  Diagram,
  AgentError,
  AgentStatus,
} from "./types";

export const ResearchAgentState = Annotation.Root({
  // Input configuration
  categories: Annotation<string[]>({
    reducer: (_prev: string[], next: string[]) => next,
    default: () => ["cs.AI", "cs.LG", "cs.CL"],
  }),
  maxPapers: Annotation<number>({
    reducer: (_prev: number, next: number) => next,
    default: () => 10,
  }),
  daysBack: Annotation<number>({
    reducer: (_prev: number, next: number) => next,
    default: () => 7,
  }),

  // Pipeline state
  fetchedPapers: Annotation<ArxivPaper[]>({
    reducer: (prev: ArxivPaper[], next: ArxivPaper[]) => [...prev, ...next],
    default: () => [],
  }),
  processedPapers: Annotation<ProcessedPaper[]>({
    reducer: (prev: ProcessedPaper[], next: ProcessedPaper[]) => [
      ...prev,
      ...next,
    ],
    default: () => [],
  }),
  insights: Annotation<Insight[]>({
    reducer: (prev: Insight[], next: Insight[]) => [...prev, ...next],
    default: () => [],
  }),
  diagrams: Annotation<Diagram[]>({
    reducer: (prev: Diagram[], next: Diagram[]) => [...prev, ...next],
    default: () => [],
  }),

  // Tracking
  errors: Annotation<AgentError[]>({
    reducer: (prev: AgentError[], next: AgentError[]) => [...prev, ...next],
    default: () => [],
  }),
  status: Annotation<AgentStatus>({
    reducer: (_prev: AgentStatus, next: AgentStatus) => next,
    default: () => "idle" as AgentStatus,
  }),
  progressMessage: Annotation<string>({
    reducer: (_prev: string, next: string) => next,
    default: () => "",
  }),

  // Saved IDs for reference
  savedPaperIds: Annotation<string[]>({
    reducer: (prev: string[], next: string[]) => [...prev, ...next],
    default: () => [],
  }),
  savedInsightIds: Annotation<string[]>({
    reducer: (prev: string[], next: string[]) => [...prev, ...next],
    default: () => [],
  }),
  savedDiagramIds: Annotation<string[]>({
    reducer: (prev: string[], next: string[]) => [...prev, ...next],
    default: () => [],
  }),
});

export type ResearchAgentStateType = typeof ResearchAgentState.State;
