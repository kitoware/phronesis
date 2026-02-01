/* eslint-disable */
/**
 * Generated Convex API types - placeholder file.
 *
 * Run `npx convex dev` to generate the actual types.
 */

import type { FilterApi, FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";

export declare const api: {
  papers: {
    list: FunctionReference<"query", "public">;
    getById: FunctionReference<"query", "public">;
    getByArxivId: FunctionReference<"query", "public">;
    search: FunctionReference<"query", "public">;
    create: FunctionReference<"mutation", "public">;
    updateStatus: FunctionReference<"mutation", "public">;
    getStats: FunctionReference<"query", "public">;
  };
  insights: {
    getByPaperId: FunctionReference<"query", "public">;
    list: FunctionReference<"query", "public">;
    searchSimilar: FunctionReference<"query", "public">;
    create: FunctionReference<"mutation", "public">;
    getStats: FunctionReference<"query", "public">;
  };
  trends: {
    list: FunctionReference<"query", "public">;
    getByTopic: FunctionReference<"query", "public">;
    create: FunctionReference<"mutation", "public">;
    getCategories: FunctionReference<"query", "public">;
    getTopics: FunctionReference<"query", "public">;
  };
  startups: {
    list: FunctionReference<"query", "public">;
    getById: FunctionReference<"query", "public">;
    search: FunctionReference<"query", "public">;
    create: FunctionReference<"mutation", "public">;
    update: FunctionReference<"mutation", "public">;
    getStats: FunctionReference<"query", "public">;
  };
  problems: {
    list: FunctionReference<"query", "public">;
    getById: FunctionReference<"query", "public">;
    getByStartup: FunctionReference<"query", "public">;
    searchSimilar: FunctionReference<"query", "public">;
    create: FunctionReference<"mutation", "public">;
    updateStatus: FunctionReference<"mutation", "public">;
    getStats: FunctionReference<"query", "public">;
  };
  researchLinks: {
    list: FunctionReference<"query", "public">;
    getById: FunctionReference<"query", "public">;
    getByProblem: FunctionReference<"query", "public">;
    getByPaper: FunctionReference<"query", "public">;
    create: FunctionReference<"mutation", "public">;
    updateReview: FunctionReference<"mutation", "public">;
    getStats: FunctionReference<"query", "public">;
  };
  solutionReports: {
    list: FunctionReference<"query", "public">;
    getById: FunctionReference<"query", "public">;
    getByProblem: FunctionReference<"query", "public">;
    create: FunctionReference<"mutation", "public">;
    update: FunctionReference<"mutation", "public">;
    updateStatus: FunctionReference<"mutation", "public">;
    getStats: FunctionReference<"query", "public">;
  };
  users: {
    getByClerkId: FunctionReference<"query", "public">;
    getById: FunctionReference<"query", "public">;
    getCurrent: FunctionReference<"query", "public">;
    updatePreferences: FunctionReference<"mutation", "public">;
    completeOnboarding: FunctionReference<"mutation", "public">;
    updateLastActive: FunctionReference<"mutation", "public">;
  };
  bookmarks: {
    list: FunctionReference<"query", "public">;
    isBookmarked: FunctionReference<"query", "public">;
    create: FunctionReference<"mutation", "public">;
    update: FunctionReference<"mutation", "public">;
    remove: FunctionReference<"mutation", "public">;
    getStats: FunctionReference<"query", "public">;
  };
  agentRuns: {
    list: FunctionReference<"query", "public">;
    getById: FunctionReference<"query", "public">;
    getLatestByType: FunctionReference<"query", "public">;
    create: FunctionReference<"mutation", "public">;
    start: FunctionReference<"mutation", "public">;
    complete: FunctionReference<"mutation", "public">;
    fail: FunctionReference<"mutation", "public">;
    cancel: FunctionReference<"mutation", "public">;
    getStats: FunctionReference<"query", "public">;
  };
};

export declare const internal: {
  users: {
    upsertFromClerk: FunctionReference<"mutation", "internal">;
    deleteByClerkId: FunctionReference<"mutation", "internal">;
  };
};
