# Dependency audit — 31 October 2026

Production dependency audit before patches: {'info': 0, 'low': 4, 'moderate': 9, 'high': 7, 'critical': 3}

After patched Next 16.4.1, Zod 4.6.6, Sharp 0.35.5 and pinned transitive fixes through pnpm workspace overrides: {'info': 0, 'low': 0, 'moderate': 0, 'high': 0, 'critical': 0}

Command: `pnpm audit --prod --json`. Registry advisory results are a point-in-time scan, not proof of security. TypeScript/build/tests are rerun after updates. Deprecated development dependencies remain a maintenance task. No audit-ignoring flags or release-age policy reductions were introduced.
