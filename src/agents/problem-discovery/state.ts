import { Annotation } from "@langchain/langgraph";
import type {
  SearchQuery,
  SearchResult,
  Problem,
  ImplicitSignal,
  ProblemCluster,
  ErrorInfo,
  ProcessingStatus,
  Progress,
  SavedProblem,
  SavedSignal,
  SavedCluster,
  AgentMetrics,
} from "./types";
import { normalizeUrl } from "./types";

function appendReducer<T>(existing: T[], incoming: T[]): T[] {
  return [...existing, ...incoming];
}

function deduplicateByUrl(
  existing: SearchResult[],
  incoming: SearchResult[]
): SearchResult[] {
  const urlSet = new Set(existing.map((r) => normalizeUrl(r.url)));
  const newResults: SearchResult[] = [];

  for (const result of incoming) {
    const normalized = normalizeUrl(result.url);
    if (!urlSet.has(normalized)) {
      urlSet.add(normalized);
      newResults.push(result);
    }
  }

  return [...existing, ...newResults];
}

function replaceReducer<T>(existing: T, incoming: T): T {
  return incoming;
}

export const ProblemDiscoveryState = Annotation.Root({
  searchQueries: Annotation<SearchQuery[]>({
    default: () => [],
    reducer: appendReducer,
  }),

  rawResults: Annotation<SearchResult[]>({
    default: () => [],
    reducer: deduplicateByUrl,
  }),

  extractedProblems: Annotation<Problem[]>({
    default: () => [],
    reducer: appendReducer,
  }),

  implicitSignals: Annotation<ImplicitSignal[]>({
    default: () => [],
    reducer: appendReducer,
  }),

  clusteredProblems: Annotation<ProblemCluster[]>({
    default: () => [],
    reducer: replaceReducer,
  }),

  savedProblems: Annotation<SavedProblem[]>({
    default: () => [],
    reducer: appendReducer,
  }),

  savedSignals: Annotation<SavedSignal[]>({
    default: () => [],
    reducer: appendReducer,
  }),

  savedClusters: Annotation<SavedCluster[]>({
    default: () => [],
    reducer: appendReducer,
  }),

  errors: Annotation<ErrorInfo[]>({
    default: () => [],
    reducer: appendReducer,
  }),

  status: Annotation<ProcessingStatus>({
    default: () => "idle" as ProcessingStatus,
    reducer: replaceReducer,
  }),

  progress: Annotation<Progress>({
    default: () => ({ current: 0, total: 0, stage: "" }),
    reducer: replaceReducer,
  }),

  metrics: Annotation<AgentMetrics>({
    default: () => ({
      startTime: Date.now(),
      searchQueries: 0,
      rawResults: 0,
      extractedProblems: 0,
      implicitSignals: 0,
      clusters: 0,
      apiCalls: 0,
      tokensUsed: 0,
    }),
    reducer: (existing, incoming) => ({
      ...existing,
      ...incoming,
      apiCalls: existing.apiCalls + (incoming.apiCalls ?? 0),
      tokensUsed: existing.tokensUsed + (incoming.tokensUsed ?? 0),
    }),
  }),
});

export type ProblemDiscoveryStateType = typeof ProblemDiscoveryState.State;
