export { getConvexClient, resetConvexClient, getApi, api } from "./client";

import {
  createPaperTool,
  getPaperTool,
  getPaperByArxivIdTool,
  listPapersTool,
  searchPapersTool,
  updatePaperStatusTool,
  paperTools,
} from "./papers";

import {
  createInsightTool,
  getInsightByPaperTool,
  listInsightsTool,
  searchSimilarInsightsTool,
  insightTools,
} from "./insights";

import {
  createProblemTool,
  getProblemTool,
  listProblemsTool,
  searchSimilarProblemsTool,
  updateProblemStatusTool,
  problemTools,
} from "./problems";

import {
  createStartupTool,
  getStartupTool,
  listStartupsTool,
  searchStartupsTool,
  updateStartupTool,
  startupTools,
} from "./startups";

import {
  createLinkTool,
  getLinkTool,
  listLinksTool,
  getLinksByProblemTool,
  updateLinkReviewTool,
  linkTools,
} from "./links";

import {
  createReportTool,
  getReportTool,
  listReportsTool,
  updateReportTool,
  updateReportStatusTool,
  reportTools,
} from "./reports";

import {
  createTrendTool,
  getTrendByTopicTool,
  listTrendsTool,
  trendTools,
} from "./trends";

import {
  createAgentTaskTool,
  getNextTaskTool,
  updateTaskStatusTool,
  listTasksTool,
  getTaskTool,
  taskTools,
} from "./tasks";

import {
  saveCheckpointTool,
  loadCheckpointTool,
  listCheckpointsTool,
  deleteCheckpointsTool,
  checkpointTools,
} from "./checkpoints";

import {
  requestApprovalTool,
  checkApprovalTool,
  listPendingApprovalsTool,
  resolveApprovalTool,
  approvalTools,
} from "./approvals";

// Re-export all
export {
  createPaperTool,
  getPaperTool,
  getPaperByArxivIdTool,
  listPapersTool,
  searchPapersTool,
  updatePaperStatusTool,
  paperTools,
  createInsightTool,
  getInsightByPaperTool,
  listInsightsTool,
  searchSimilarInsightsTool,
  insightTools,
  createProblemTool,
  getProblemTool,
  listProblemsTool,
  searchSimilarProblemsTool,
  updateProblemStatusTool,
  problemTools,
  createStartupTool,
  getStartupTool,
  listStartupsTool,
  searchStartupsTool,
  updateStartupTool,
  startupTools,
  createLinkTool,
  getLinkTool,
  listLinksTool,
  getLinksByProblemTool,
  updateLinkReviewTool,
  linkTools,
  createReportTool,
  getReportTool,
  listReportsTool,
  updateReportTool,
  updateReportStatusTool,
  reportTools,
  createTrendTool,
  getTrendByTopicTool,
  listTrendsTool,
  trendTools,
  createAgentTaskTool,
  getNextTaskTool,
  updateTaskStatusTool,
  listTasksTool,
  getTaskTool,
  taskTools,
  saveCheckpointTool,
  loadCheckpointTool,
  listCheckpointsTool,
  deleteCheckpointsTool,
  checkpointTools,
  requestApprovalTool,
  checkApprovalTool,
  listPendingApprovalsTool,
  resolveApprovalTool,
  approvalTools,
};

// Aggregate all data tools
export const allDataTools = [
  ...paperTools,
  ...insightTools,
  ...problemTools,
  ...startupTools,
  ...linkTools,
  ...reportTools,
  ...trendTools,
  ...taskTools,
  ...checkpointTools,
  ...approvalTools,
];
