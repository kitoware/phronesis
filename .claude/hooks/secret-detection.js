#!/usr/bin/env node
/**
 * PreToolUse Hook: Block commits containing secrets/API keys
 * Triggers on: Bash tool when running git commit
 */

const { execSync } = require("child_process");

// Patterns that indicate secrets (regex patterns)
const SECRET_PATTERNS = [
  // API Keys
  { pattern: /sk-[a-zA-Z0-9]{20,}/, name: "OpenAI API Key" },
  { pattern: /sk-proj-[a-zA-Z0-9-_]{20,}/, name: "OpenAI Project Key" },
  { pattern: /sk-ant-[a-zA-Z0-9-_]{20,}/, name: "Anthropic API Key" },
  { pattern: /xai-[a-zA-Z0-9]{20,}/, name: "xAI API Key" },
  { pattern: /AIza[a-zA-Z0-9_-]{35}/, name: "Google API Key" },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, name: "GitHub Personal Token" },
  { pattern: /gho_[a-zA-Z0-9]{36}/, name: "GitHub OAuth Token" },
  { pattern: /github_pat_[a-zA-Z0-9_]{22,}/, name: "GitHub PAT" },

  // AWS
  { pattern: /AKIA[A-Z0-9]{16}/, name: "AWS Access Key" },

  // Clerk
  { pattern: /sk_live_[a-zA-Z0-9]{20,}/, name: "Clerk Secret Key" },
  { pattern: /pk_live_[a-zA-Z0-9]{20,}/, name: "Clerk Publishable Key (Live)" },

  // Generic patterns
  { pattern: /['"][a-zA-Z0-9_-]*(?:api[_-]?key|apikey|secret|password|token|credential)[a-zA-Z0-9_-]*['"]\s*[:=]\s*['"][^'"]{10,}['"]/i, name: "Hardcoded Secret" },

  // Private keys
  { pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/, name: "Private Key" },
];

async function main() {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  const event = JSON.parse(input);
  const command = event.tool_input?.command || "";

  // Only check git commit commands
  if (!command.includes("git commit")) {
    process.exit(0); // Allow to continue
  }

  try {
    // Get staged diff
    const diff = execSync("git diff --cached", {
      cwd: process.env.CLAUDE_PROJECT_DIR,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const foundSecrets = [];

    for (const { pattern, name } of SECRET_PATTERNS) {
      if (pattern.test(diff)) {
        foundSecrets.push(name);
      }
    }

    if (foundSecrets.length > 0) {
      console.log(
        JSON.stringify({
          decision: "block",
          reason: `🚨 BLOCKED: Potential secrets detected in staged changes:\n- ${foundSecrets.join("\n- ")}\n\nPlease remove secrets and use environment variables instead.`,
        })
      );
      process.exit(2); // Block the operation
    }

    process.exit(0); // Allow to continue
  } catch (error) {
    // If git diff fails, allow the commit (might not be in a git repo)
    process.exit(0);
  }
}

main();
