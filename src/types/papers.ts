import { Id } from "../../convex/_generated/dataModel";

export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

export interface Author {
  name: string;
  affiliations?: string[];
}

export interface Paper {
  _id: Id<"papers">;
  arxivId: string;
  title: string;
  abstract: string;
  authors: Author[];
  categories: string[];
  primaryCategory: string;
  publishedDate: string;
  updatedDate?: string;
  pdfUrl: string;
  doi?: string;
  journalRef?: string;
  comments?: string;
  processingStatus: ProcessingStatus;
  processingError?: string;
  fetchedAt: number;
  processedAt?: number;
}

export interface PaperSection {
  title: string;
  content: string;
  level: number;
}

export interface PaperFigure {
  caption: string;
  reference: string;
  pageNumber?: number;
}

export interface PaperTable {
  caption: string;
  content: string;
  reference: string;
}

export interface PaperEquation {
  latex: string;
  reference?: string;
  context?: string;
}

export interface PaperReference {
  title?: string;
  authors?: string[];
  year?: string;
  venue?: string;
  doi?: string;
  arxivId?: string;
}

export interface PaperContent {
  _id: Id<"paperContent">;
  paperId: Id<"papers">;
  fullText?: string;
  sections: PaperSection[];
  figures: PaperFigure[];
  tables: PaperTable[];
  equations: PaperEquation[];
  references: PaperReference[];
  extractedAt: number;
}
