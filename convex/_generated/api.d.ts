/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentApprovals from "../agentApprovals.js";
import type * as agentCache from "../agentCache.js";
import type * as agentCheckpoints from "../agentCheckpoints.js";
import type * as agentRuns from "../agentRuns.js";
import type * as agentTasks from "../agentTasks.js";
import type * as agents_insightGeneration from "../agents/insightGeneration.js";
import type * as agents_problemDiscovery from "../agents/problemDiscovery.js";
import type * as agents_research from "../agents/research.js";
import type * as agents_researchLinking from "../agents/researchLinking.js";
import type * as agents_trendAnalysis from "../agents/trendAnalysis.js";
import type * as bookmarks from "../bookmarks.js";
import type * as http from "../http.js";
import type * as implicitSignals from "../implicitSignals.js";
import type * as insights from "../insights.js";
import type * as papers from "../papers.js";
import type * as problemClusters from "../problemClusters.js";
import type * as problems from "../problems.js";
import type * as researchLinks from "../researchLinks.js";
import type * as solutionReports from "../solutionReports.js";
import type * as startups from "../startups.js";
import type * as trends from "../trends.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentApprovals: typeof agentApprovals;
  agentCache: typeof agentCache;
  agentCheckpoints: typeof agentCheckpoints;
  agentRuns: typeof agentRuns;
  agentTasks: typeof agentTasks;
  "agents/insightGeneration": typeof agents_insightGeneration;
  "agents/problemDiscovery": typeof agents_problemDiscovery;
  "agents/research": typeof agents_research;
  "agents/researchLinking": typeof agents_researchLinking;
  "agents/trendAnalysis": typeof agents_trendAnalysis;
  bookmarks: typeof bookmarks;
  http: typeof http;
  implicitSignals: typeof implicitSignals;
  insights: typeof insights;
  papers: typeof papers;
  problemClusters: typeof problemClusters;
  problems: typeof problems;
  researchLinks: typeof researchLinks;
  solutionReports: typeof solutionReports;
  startups: typeof startups;
  trends: typeof trends;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
