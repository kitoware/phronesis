import { downloadPdfTool, downloadPdfBuffer, downloadTools } from "./download";

import {
  extractPdfTextTool,
  extractPdfTextFromBufferTool,
  extractTextTools,
} from "./extract-text";

import { extractPdfFiguresTool, extractFigureTools } from "./extract-figures";

import { extractPdfTablesTool, extractTableTools } from "./extract-tables";

import { extractPdfRefsTool, extractRefTools } from "./extract-refs";

// Re-export all
export {
  downloadPdfTool,
  downloadPdfBuffer,
  downloadTools,
  extractPdfTextTool,
  extractPdfTextFromBufferTool,
  extractTextTools,
  extractPdfFiguresTool,
  extractFigureTools,
  extractPdfTablesTool,
  extractTableTools,
  extractPdfRefsTool,
  extractRefTools,
};

// Aggregate all PDF tools
export const allPdfTools = [
  ...downloadTools,
  ...extractTextTools,
  ...extractFigureTools,
  ...extractTableTools,
  ...extractRefTools,
];
