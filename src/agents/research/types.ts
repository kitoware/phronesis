import { Id } from "../../../convex/_generated/dataModel";

export interface ArxivAuthor {
  name: string;
  affiliations?: string[];
}

export interface ArxivPaper {
  arxivId: string;
  title: string;
  abstract: string;
  authors: ArxivAuthor[];
  categories: string[];
  primaryCategory: string;
  publishedDate: string;
  updatedDate?: string;
  pdfUrl: string;
  doi?: string;
  journalRef?: string;
  comments?: string;
}

export interface ExtractedSection {
  title: string;
  content: string;
  level: number;
}

export interface ExtractedFigure {
  caption: string;
  reference: string;
  pageNumber?: number;
}

export interface ExtractedTable {
  caption: string;
  content: string;
  reference: string;
}

export interface ExtractedEquation {
  latex: string;
  reference?: string;
  context?: string;
}

export interface ExtractedReference {
  title?: string;
  authors?: string[];
  year?: string;
  venue?: string;
  doi?: string;
  arxivId?: string;
}

export interface ProcessedPaper extends ArxivPaper {
  fullText?: string;
  sections: ExtractedSection[];
  figures: ExtractedFigure[];
  tables: ExtractedTable[];
  equations: ExtractedEquation[];
  references: ExtractedReference[];
  extractionError?: string;
}

export interface Contribution {
  rank: number;
  contribution: string;
  noveltyScore: number;
  evidenceStrength: number;
}

export interface IndustryApplication {
  industry: string;
  application: string;
  feasibility: string;
}

export interface TechnicalContribution {
  type: string;
  description: string;
  significance: "incremental" | "notable" | "significant" | "breakthrough";
}

export interface Summaries {
  technical: string;
  executive: string;
  tweet: string;
  eli5: string;
}

export interface Insight {
  paperId?: Id<"papers">;
  summary: string;
  keyFindings: string[];
  methodology: string;
  limitations: string[];
  futureWork: string[];
  technicalContributions: TechnicalContribution[];
  practicalApplications: string[];
  targetAudience: string[];
  prerequisites: string[];
  embedding: number[];

  // Plan 3 additions
  problemStatement?: string;
  proposedSolution?: string;
  technicalApproach?: string;
  mainResults?: string;
  contributions?: Contribution[];
  statedLimitations?: string[];
  inferredWeaknesses?: string[];
  reproducibilityScore?: number;
  industryApplications?: IndustryApplication[];
  technologyReadinessLevel?: number;
  timeToCommercial?: string;
  enablingTechnologies?: string[];
  summaries?: Summaries;
}

export type DiagramType =
  | "architecture"
  | "flowchart"
  | "sequence"
  | "comparison"
  | "timeline"
  | "mindmap"
  | "custom";

export interface Diagram {
  paperId?: Id<"papers">;
  insightId?: Id<"insights">;
  type: DiagramType;
  title: string;
  description: string;
  mermaidCode?: string;
  d3Config?: string;
  svgContent?: string;
}

export type AgentStatus =
  | "idle"
  | "fetching"
  | "processing"
  | "analyzing"
  | "embedding"
  | "diagramming"
  | "saving"
  | "completed"
  | "failed";

export interface AgentError {
  stage: string;
  message: string;
  paperId?: string;
  timestamp: number;
}

export interface AgentProgress {
  stage: AgentStatus;
  current: number;
  total: number;
  message: string;
}
