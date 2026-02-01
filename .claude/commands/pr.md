# PR Workflow with Worktrees

## Worktree Structure

```
~/phronesis/        → main (primary repo)
~/phronesis-plan2/  → feature/plan2
~/phronesis-plan3/  → feature/plan3
~/phronesis-plan4/  → feature/plan4
~/phronesis-plan5/  → feature/plan5
~/phronesis-plan6/  → feature/plan6
```

## Creating a PR

In each worktree when ready:

```bash
# Push branch and create PR
git push -u origin feature/plan2
gh pr create --title "feat: plan 2 - paper discovery" --body "$(cat <<'EOF'
## Summary
- Brief description of changes

## Test plan
- [ ] Manual testing steps
- [ ] Unit tests pass
- [ ] E2E tests pass
EOF
)"
```

## PR Strategies

### Independent PRs (plans are unrelated)
Each PR merges directly to main. Review and merge in any order.

```bash
gh pr create --base main --head feature/plan2
```

### Stacked PRs (plans depend on each other)
Create PRs with different base branches, merge in order.

```bash
# Plan 2 targets main
gh pr create --base main --head feature/plan2

# Plan 3 targets plan2
gh pr create --base feature/plan2 --head feature/plan3
```

## Keeping PRs Updated

When main changes (another PR merged):

```bash
git fetch origin main
git rebase origin/main
git push --force-with-lease  # Update the PR
```

## Reviewing PR Status

```bash
gh pr list                    # All open PRs
gh pr status                  # Your PRs and review requests
gh pr view feature/plan2      # Specific PR details
gh pr checks feature/plan2    # CI status
```

## After PR Merge

```bash
# Update main in primary repo
cd ~/phronesis
git checkout main
git pull

# Remove the worktree
git worktree remove ../phronesis-plan2

# Delete local branch
git branch -d feature/plan2
```

## Conflict Resolution

If PRs conflict after one merges:

```bash
cd ../phronesis-plan3
git fetch origin main
git rebase origin/main
# Resolve conflicts
git add .
git rebase --continue
git push --force-with-lease
```

## Managing Worktrees

```bash
git worktree list             # Show all worktrees
git worktree add <path> -b <branch>  # Create new worktree
git worktree remove <path>    # Remove worktree
git worktree prune            # Clean stale worktrees
```
