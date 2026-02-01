import { Id } from "../../convex/_generated/dataModel";

export type Significance =
  | "incremental"
  | "notable"
  | "significant"
  | "breakthrough";

export interface TechnicalContribution {
  type: string;
  description: string;
  significance: Significance;
}

export interface Insight {
  _id: Id<"insights">;
  paperId: Id<"papers">;
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
  analysisVersion: string;
  analyzedAt: number;
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
  _id: Id<"diagrams">;
  paperId: Id<"papers">;
  insightId?: Id<"insights">;
  type: DiagramType;
  title: string;
  description: string;
  mermaidCode?: string;
  d3Config?: string;
  svgContent?: string;
  createdAt: number;
}
