---
name: github-sync
description: >-
  Automates Git initialization, commit, new GitHub repository creation, and push synchronization using GitHub CLI (gh) for account schuna (jiyong1972@gmail.com). Use this skill when the user asks to create a new GitHub repository, link a project to GitHub, or commit and push changes.
---

# GitHub CLI (`gh`) Automated Sync Skill

Use this workflow whenever the user requests creating a new GitHub repository or syncing local changes to GitHub.

## 1. Environment & Account Defaults

- **GitHub Account**: `schuna`
- **Git Author Email**: `jiyong1972@gmail.com`
- **GitHub CLI Path (Windows)**: `& "C:\Program Files\GitHub CLI\gh.exe"` (use this full path if `gh` is not in the current shell `PATH`)

## 2. Creating and Syncing a New Repository

1. Ensure `.gitignore` exists at the project root (excluding `node_modules/`, `dist/`, `.env*`, etc.).
2. Run the following PowerShell sequence in the project root:
   ```powershell
   git init
   git config user.name "schuna"
   git config user.email "jiyong1972@gmail.com"
   git add .
   git commit -m "<commit-message>"
   git branch -M main
   & "C:\Program Files\GitHub CLI\gh.exe" repo create <RepoName> --private --source=. --remote=origin --push
   ```

## 3. Syncing Subsequent Changes

When the repository is already linked to `origin`:
```powershell
git add .
git commit -m "<commit-message>"
git push
```
