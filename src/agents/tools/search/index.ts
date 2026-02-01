import { exaSearchTool, exaFindSimilarTool, exaTools } from "./exa";

import { arxivSearchTool, arxivFetchByIdTool, arxivTools } from "./arxiv";

import {
  crunchbaseSearchTool,
  crunchbaseGetDetailsTool,
  crunchbaseTools,
} from "./crunchbase";

import { tavilySearchTool, tavilyTools } from "./tavily";

import { youtubeTranscriptTool, youtubeTools } from "./youtube";

// Re-export all
export {
  exaSearchTool,
  exaFindSimilarTool,
  exaTools,
  arxivSearchTool,
  arxivFetchByIdTool,
  arxivTools,
  crunchbaseSearchTool,
  crunchbaseGetDetailsTool,
  crunchbaseTools,
  tavilySearchTool,
  tavilyTools,
  youtubeTranscriptTool,
  youtubeTools,
};

// Aggregate all search tools
export const allSearchTools = [
  ...exaTools,
  ...arxivTools,
  ...crunchbaseTools,
  ...tavilyTools,
  ...youtubeTools,
];
