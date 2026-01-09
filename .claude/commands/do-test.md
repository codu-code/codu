---
description: Run development verification checks (lint, build, and optionally e2e tests)
argument-hint: "[e2e]"
---

## Development Test Suite

Run comprehensive development verification checks for the Codu project.

## Current Context

Branch: !`git branch --show-current`
Status: !`git status --short | head -10`

## Task

Run the following verification steps in order:

### 1. Lint Check
Run ESLint and verify there are **0 errors** (warnings are acceptable):
```bash
npm run lint
```
Report the error/warning counts.

### 2. TypeScript Compilation
Verify TypeScript compiles without errors:
```bash
npx tsc --noEmit
```

### 3. Build Check
Verify the Next.js build completes successfully:
```bash
npm run build
```

### 4. E2E Tests (if requested)
If `$ARGUMENTS` includes "e2e", also run E2E tests:
```bash
npm run test:e2e
```

## Output

Provide a clear summary:
- Lint: PASS/FAIL (X errors, Y warnings)
- TypeScript: PASS/FAIL
- Build: PASS/FAIL
- E2E Tests: PASS/FAIL/SKIPPED

If any check fails, provide details and suggest fixes.
