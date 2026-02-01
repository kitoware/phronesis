#!/usr/bin/env node
/**
 * PostToolUse Hook: Auto-format files with Prettier after editing
 * Triggers on: Edit, Write tools for supported file types
 */

const { execSync } = require("child_process");
const path = require("path");

const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".md"];

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
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
    return;
  }

  // Skip node_modules and .next
  if (filePath.includes("node_modules") || filePath.includes(".next")) {
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
    return;
  }

  try {
    execSync(`pnpm prettier --write "${filePath}"`, {
      cwd: process.env.CLAUDE_PROJECT_DIR,
      stdio: "pipe",
    });
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
  } catch (error) {
    console.log(
      JSON.stringify({
        continue: true,
        additionalContext: `Prettier formatting failed for ${path.basename(filePath)}: ${error.message}`,
      })
    );
  }
}

main();
