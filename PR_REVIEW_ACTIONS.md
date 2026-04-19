# Pull Request Review & Live Review Setup

Date reviewed: 2026-04-19 (UTC)

## Setup completed in this environment

The following requested setup has already been done:

1. GitHub remote added:
   ```bash
   git remote add origin https://github.com/SeanPVera/aamva-pdf417-generator.git
   ```
2. GitHub CLI installed (`gh 2.45.0`).

Current blocker to live PR review: GitHub authentication is still required.

## Final step you need to run

```bash
gh auth login
```

After login, live PR review commands will work:

```bash
gh pr list --state open --limit 30
gh pr view <pr-number> --comments --web
gh pr diff <pr-number>
```

## Optional API fallback (without `gh` auth session)

Use a GitHub token with `repo` scope and call the API directly:

```bash
export GITHUB_TOKEN=<token>
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/SeanPVera/aamva-pdf417-generator/pulls?state=open
```
