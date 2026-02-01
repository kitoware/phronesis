#!/usr/bin/env node
/**
 * PreToolUse Hook: Validate build before git push
 * Triggers on: Bash tool when running git push
 */

const { execSync } = require("child_process");

async function main() {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  const event = JSON.parse(input);
  const command = event.tool_input?.command || "";

  // Only check git push commands
  if (!command.includes("git push")) {
    process.exit(0); // Allow to continue
  }

  console.error("Running build validation before push...");

  try {
    // Run typecheck first (faster)
    execSync("pnpm typecheck:src", {
      cwd: process.env.CLAUDE_PROJECT_DIR,
      stdio: "pipe",
    });

    // Run lint
    execSync("pnpm lint", {
      cwd: process.env.CLAUDE_PROJECT_DIR,
      stdio: "pipe",
    });

    // Run build
    execSync("pnpm build", {
      cwd: process.env.CLAUDE_PROJECT_DIR,
      stdio: "pipe",
    });

    console.error("✓ Build validation passed");
    process.exit(0); // Allow push
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || "";

    // Extract meaningful error info
    const errorLines = output
      .split("\n")
      .filter(
        (line) =>
          line.includes("error") ||
          line.includes("Error") ||
          line.includes("failed")
      )
      .slice(0, 20);

    console.log(
      JSON.stringify({
        decision: "block",
        reason: `🚫 BLOCKED: Build validation failed. Fix these issues before pushing:\n\n${errorLines.join("\n") || output.slice(0, 500)}`,
      })
    );
    process.exit(2); // Block the push
  }
}

main();
