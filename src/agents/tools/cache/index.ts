import {
  memoryCacheGet,
  memoryCacheSet,
  memoryCacheDelete,
  memoryCacheClear,
  memoryCacheCleanup,
  memoryCacheSize,
  memoryCacheGetTool,
  memoryCacheSetTool,
  memoryCacheDeleteTool,
  memoryCacheClearTool,
  memoryCacheTools,
} from "./memory";

import {
  convexCacheGetTool,
  convexCacheSetTool,
  convexCacheDeleteTool,
  convexCacheCleanupTool,
  convexCacheClearNamespaceTool,
  convexCacheTools,
} from "./convex";

// Re-export all
export {
  memoryCacheGet,
  memoryCacheSet,
  memoryCacheDelete,
  memoryCacheClear,
  memoryCacheCleanup,
  memoryCacheSize,
  memoryCacheGetTool,
  memoryCacheSetTool,
  memoryCacheDeleteTool,
  memoryCacheClearTool,
  memoryCacheTools,
  convexCacheGetTool,
  convexCacheSetTool,
  convexCacheDeleteTool,
  convexCacheCleanupTool,
  convexCacheClearNamespaceTool,
  convexCacheTools,
};

// Aggregate all cache tools
export const allCacheTools = [...memoryCacheTools, ...convexCacheTools];
