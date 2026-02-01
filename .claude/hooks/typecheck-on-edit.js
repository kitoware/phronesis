#!/usr/bin/env node
/**
 * PostToolUse Hook: TypeScript type-check after editing .ts/.tsx files
 * Triggers on: Edit, Write tools for TypeScript files
 */

const { execSync } = require("child_process");
const path = require("path");

const TS_EXTENSIONS = [".ts", ".tsx"];

async function main() {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  const event = JSON.parse(input);
  const filePath = event.tool_input?.file_path;

  if (!filePath) {
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
    return;
  }

  const ext = path.extname(filePath);
  if (!TS_EXTENSIONS.includes(ext)) {
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
    return;
  }

  // Skip node_modules, .next, and convex (has its own tsconfig)
  if (
    filePath.includes("node_modules") ||
    filePath.includes(".next") ||
    filePath.includes("/convex/")
  ) {
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
    return;
  }

  try {
    execSync("pnpm typecheck:src", {
      cwd: process.env.CLAUDE_PROJECT_DIR,
      stdio: "pipe",
    });
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
  } catch (error) {
    // Parse TypeScript errors from stderr/stdout
    const output = error.stdout?.toString() || error.stderr?.toString() || "";
    const errorLines = output
      .split("\n")
      .filter((line) => line.includes("error TS"))
      .slice(0, 10); // Limit to first 10 errors

    const errorCount = (output.match(/error TS/g) || []).length;
    const summary =
      errorCount > 0
        ? `TypeScript: ${errorCount} error(s) found.\n${errorLines.join("\n")}`
        : `TypeScript check failed: ${error.message}`;

    console.log(
      JSON.stringify({
        continue: true,
        additionalContext: summary,
      })
    );
  }
}

main();
