/* eslint-disable */
/**
 * Generated Convex data model types - placeholder file.
 *
 * Run `npx convex dev` to generate the actual types.
 */

import type { GenericId } from "convex/values";

export type TableNames =
  | "papers"
  | "paperContent"
  | "insights"
  | "diagrams"
  | "trends"
  | "startups"
  | "startupProblems"
  | "founders"
  | "implicitSignals"
  | "researchLinks"
  | "solutionReports"
  | "users"
  | "bookmarks"
  | "agentRuns";

export type Id<TableName extends TableNames> = GenericId<TableName>;

export type DataModel = {
  papers: {
    _id: Id<"papers">;
    _creationTime: number;
    [key: string]: unknown;
  };
  paperContent: {
    _id: Id<"paperContent">;
    _creationTime: number;
    [key: string]: unknown;
  };
  insights: {
    _id: Id<"insights">;
    _creationTime: number;
    [key: string]: unknown;
  };
  diagrams: {
    _id: Id<"diagrams">;
    _creationTime: number;
    [key: string]: unknown;
  };
  trends: {
    _id: Id<"trends">;
    _creationTime: number;
    [key: string]: unknown;
  };
  startups: {
    _id: Id<"startups">;
    _creationTime: number;
    [key: string]: unknown;
  };
  startupProblems: {
    _id: Id<"startupProblems">;
    _creationTime: number;
    [key: string]: unknown;
  };
  founders: {
    _id: Id<"founders">;
    _creationTime: number;
    [key: string]: unknown;
  };
  implicitSignals: {
    _id: Id<"implicitSignals">;
    _creationTime: number;
    [key: string]: unknown;
  };
  researchLinks: {
    _id: Id<"researchLinks">;
    _creationTime: number;
    [key: string]: unknown;
  };
  solutionReports: {
    _id: Id<"solutionReports">;
    _creationTime: number;
    [key: string]: unknown;
  };
  users: {
    _id: Id<"users">;
    _creationTime: number;
    [key: string]: unknown;
  };
  bookmarks: {
    _id: Id<"bookmarks">;
    _creationTime: number;
    [key: string]: unknown;
  };
  agentRuns: {
    _id: Id<"agentRuns">;
    _creationTime: number;
    [key: string]: unknown;
  };
};
