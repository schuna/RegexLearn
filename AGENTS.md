# Workspace Rules & Learned Preferences

## 1. Git & GitHub Synchronization (`schuna`)
- **Git Author Config**:
  - `user.name`: `schuna`
  - `user.email`: `jiyong1972@gmail.com`
- **GitHub CLI (`gh`) Executable**:
  - Default path on Windows: `"C:\Program Files\GitHub CLI\gh.exe"` (use full path if `gh` is not recognized in PATH).
- **Default Branch**: `main`
- **Remote Repository**: `https://github.com/schuna/RegexLearn.git`

## 2. Local Development Environment
- **Dev Server Port**: Avoid port `5173` (already in use by another local application). Use port `5188` (`http://localhost:5188`) by default.
- **Node.js Runtime Compatibility**: The local system Node.js version is `v14.15.1` (`npm 6.14.8`). Keep package dependencies compatible with Node 14 (e.g., `vite@^2.9.18`, `@vitejs/plugin-react@^1.3.2`).
