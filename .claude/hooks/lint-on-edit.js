#!/usr/bin/env node
/**
 * PostToolUse Hook: ESLint check with auto-fix after editing
 * Triggers on: Edit, Write tools for JS/TS files
 */

const { execSync } = require("child_process");
const path = require("path");

const LINT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

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
  if (!LINT_EXTENSIONS.includes(ext)) {
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
    return;
  }

  // Skip node_modules and .next
  if (filePath.includes("node_modules") || filePath.includes(".next")) {
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
    return;
  }

  try {
    // Run ESLint with auto-fix
    execSync(`pnpm next lint --fix --file "${filePath}"`, {
      cwd: process.env.CLAUDE_PROJECT_DIR,
      stdio: "pipe",
    });
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || "";

    // Count errors and warnings
    const errorMatch = output.match(/(\d+) errors?/);
    const warningMatch = output.match(/(\d+) warnings?/);
    const errors = errorMatch ? parseInt(errorMatch[1]) : 0;
    const warnings = warningMatch ? parseInt(warningMatch[1]) : 0;

    if (errors === 0 && warnings === 0) {
      // Likely a different issue, not lint errors
      console.log(JSON.stringify({ continue: true, suppressOutput: true }));
      return;
    }

    // Extract relevant lines (skip noise)
    const relevantLines = output
      .split("\n")
      .filter(
        (line) =>
          line.includes("error") ||
          line.includes("warning") ||
          line.includes("✖")
      )
      .slice(0, 15);

    console.log(
      JSON.stringify({
        continue: true,
        additionalContext: `ESLint: ${errors} error(s), ${warnings} warning(s) in ${path.basename(filePath)}.\n${relevantLines.join("\n")}`,
      })
    );
  }
}

main();
