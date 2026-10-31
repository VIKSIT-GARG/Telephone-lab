# Prompt: Telephone Lab, Phase 2 (prove it, harden it, expand it)

Paste everything below the line into your coding agent. Keep `AGENTS.md` in the repo root; this prompt extends it and does not replace it.

---

You are continuing work on **Telephone Lab**, an existing, working prototype. Read `AGENTS.md`, the README, `docs/VERIFIED.md` and the test suite first. Then inspect the code before changing anything. Implement and verify the work below. Do not only describe it.

## 0. Current state (do not rebuild what exists)

Already built and working:
- Live message studio: users enter messages, review and edit extracted facts, mark critical details.
- Sarvam translation, up to 3 languages per flow, server-side API key.
- Preservation checks: English back-translation, fact-by-fact comparison, numeric/time/date checks, added-claim detection.
- One automatic repair attempt; unresolved issues stay flagged.
- Results view: native-script translations, evidence inspection, copy/download, full JSON export.
- Research lab: multi-hop chains, rewrite optimizer, hold-out evaluation, clearly labeled recorded **mock** demonstrations.
- Private hosted deployment; 41 tests passing; Hindi and Tamil smoke-tested (one Tamil run preserved 5/6 facts after repair and correctly showed "needs review").

Known gaps (this prompt closes them):
1. Extraction and checking are weak on phone numbers, conditions, negation and quantities such as "per person".
2. Translation quality is not validated by native speakers or an independent judge.
3. Research results bundled in the app are **synthetic**. No real evaluation has been run.
4. Only Hindi and Tamil were smoke-tested; other offered languages are untested.
5. Speech (TTS then STT) is not implemented.
6. No durable usage quotas or production hardening.

## 1. Rules that stay in force

1. **No invented facts about APIs.** Re-verify Sarvam (and any other provider you add) against current official docs before relying on endpoints, languages, models or limits. Update `docs/VERIFIED.md` with source and date.
2. **Never fabricate results.** Synthetic or recorded data must stay labeled everywhere it appears (UI, API, exports). Real evaluation numbers must come from real API calls made in this work. If keys, quota or budget are missing, mark that part **blocked** and say what is needed. Never fill a table with plausible numbers.
3. **No silent fallback.** Provider failures surface as errors.
4. **Secrets stay server-side.** Never commit, print or expose keys. Update `.env.example`.
5. **Honest validation states.** A language or result is only called "validated" after the evidence in §3 exists. Otherwise it is shown as `unreviewed` or `automated-checks-only`.
6. **Measure the checker, not just the translations.** A fact checker that misses mutations is worse than none, because it creates false confidence.
7. **Fictional sample messages only.** This is a research and demo tool, not an official alert system.
8. **Preserve existing behavior.** Existing tests must keep passing. Do not delete coverage to get green.
9. **Keep previous versions** of any substantially rewritten module (for example `checker_v1.py`) until the new one beats it on the gold set (§2), then clean up.

## 2. Workstream A: Make the checker reliable (highest priority)

### A1. Build a gold set of known-hard cases
Create `tests/gold/` with labeled cases: a source message, ground-truth facts, a **mutated** retelling or translation, and the expected verdict per fact (`preserved`, `altered`, `dropped`, `invented`). Cover at least:

- **Time and date:** कल meaning yesterday or tomorrow, परसों, "6 बजे" with and without शाम/सुबह, fractional times (सवा, साढ़े, पौने, डेढ़, ढाई), 12-hour vs 24-hour forms, fuzzy parts of day (शाम, रात, दोपहर), "कल रात".
- **Numbers:** Indian grouping (1,00,000), लाख/करोड़ vs million/crore, irregular Hindi number words, ranges ("2 से 3 मीटर"), decimals.
- **Phone numbers and contacts:** formats with spaces, hyphens, +91, Devanagari and Tamil digits, toll-free numbers; a single changed or dropped digit must be caught.
- **Quantities with qualifiers:** "per person", "per family", "per hour", "at most", "at least".
- **Negation:** "do not cross the bridge", partial negation ("not everyone"), and dropped or doubled negation.
- **Conditions:** "if the water crosses the mark, leave", "unless told otherwise", "only if". A dropped condition must be caught as a mutation.
- **Certainty:** will vs might vs should.
- **Places:** duplicated village names, place names that are also dictionary words, transliteration variants.
- **Added claims:** a retelling that introduces a hazard, instruction or number that was never in the source.

Aim for at least **60 cases**, written by hand or generated and then **manually reviewed**. Record who or what authored each case. Mark generated-but-unreviewed cases as such and exclude them from headline numbers.

### A2. Improve extraction and comparison
- Extend the fact schema to represent: phone numbers, conditions (with the condition and its consequence linked), negation polarity, quantity plus unit plus qualifier, certainty level, and ordering where it matters.
- Prefer **deterministic checks** (normalized numbers, times, dates, phone digits, polarity flags) for anything checkable by rule. Use an LLM only for fuzzy fields, and log its output.
- Normalize digits across scripts (Devanagari, Tamil, other offered scripts) and time expressions across languages.
- Keep added-claim detection, and extend it to numbers and instructions that appear in the retelling but not the source.

### A3. Mutation-test the checker
Write a script that **injects known mutations** into correct translations (flip a time, drop a negation, change one phone digit, remove a condition, swap a place, drop "per person") and measures:
- **Recall:** share of injected mutations the checker flags.
- **Precision:** share of flags that are real mutations (use unmutated controls to estimate false alarms).
Report both **per mutation type**, with counts. Fix the weakest types first and re-measure. Keep a before/after table in `docs/CHECKER_EVAL.md`.

**Done when:** the gold set and mutation suite run in CI/tests, results are reported honestly per type, and every mutation type with recall below your stated target is listed as a known weakness in the UI help text and README.

## 3. Workstream B: Validate translation quality

1. **Independent judge.** Add a judge that is a **different model family or provider** from the translator (verify availability and pick one; do not use the same model that translated). Have it score meaning preservation of critical facts on a fixed rubric and output structured JSON. Log prompts, outputs, model name and parameters. Show judge agreement or disagreement with the automated checker in the evidence view.
2. **Native-speaker review pack.** Build an export that gives a reviewer, per language: the source, the translation, the back-translation, each critical fact, and a simple form (correct / wrong / unclear, plus a comment). Add an import path for completed reviews. Store reviewer reviews with an anonymous reviewer ID and date.
3. **Per-language validation status** shown in the UI and exports: `unreviewed`, `automated-checks-only`, `judge-checked`, `human-reviewed (n reviewers, k cases)`. Never display a language as validated beyond what the evidence supports.
4. **Calibration.** Once human reviews exist, report agreement between humans, the judge and the automated checker. If no human reviews exist yet, say so; do not simulate them.

## 4. Workstream C: Run the real research evaluation

Replace synthetic headline results with real ones. Keep the synthetic demos, but label them **"Synthetic demo"** and keep them visually separate.

Protocol:
1. **Scenarios:** 3 fictional source messages (for example flood evacuation, cyclone shelter notice, heatwave advisory), each containing time, date, place, action, a quantity with a qualifier, a phone number and at least one condition.
2. **Chains:** define **training chains** and **unseen hold-out chains** (different language order and, if possible, different hop count). Fix them in a config file before running anything.
3. **Trials:** at least **10 per setting**; use 20 if budget allows. Settings = scenario × chain × {baseline, optimized}.
4. **Optimization** uses training chains only. **Hold-out** chains are never used for tuning.
5. **Metrics:** Critical Fact Survival, danger rate, per-fact mutation counts, length ratio. Use the improved checker from §2 and report judge agreement from §3 on a sampled subset.
6. **Statistics:** report means with confidence intervals (bootstrap or Wilson, state which), the trial count next to every number, and effect sizes. State plainly if the optimized version does not beat baseline on hold-out chains.
7. **Cost and reproducibility:** cache raw API outputs, record seeds, model names and parameters, enforce a spend cap with a dry-run that prints the estimated call count first, and make the run resumable.
8. **Output:** `results/real/` with raw JSON, a summary table, charts, and `docs/EVALUATION.md`. The app's research tab should load these and show a clear **"Real run, N trials, date"** badge.

If keys, quota or budget make the full protocol impossible, run what is possible, mark the rest **blocked**, and report exactly what ran.

## 5. Workstream D: Test every offered language

- Build a **language coverage matrix**: for each offered language, run the gold-set subset (translation, back-translation, check) and a small round-trip chain.
- Report per language: verified API support, number of cases run, checker pass rate, any script or digit problems (numerals, punctuation, rendering of native script in the UI and exports), and validation status from §3.
- Any language with fewer than your minimum case count is labeled **"limited testing"** in the UI. Do not hide this.
- For dialects or languages the API does not directly support, state the exact substitution used.

## 6. Workstream E: Speech hop (optional, after A to D)

Only if A to D are done and verified:
- Add a **TTS then STT** hop using Sarvam's voice APIs (verify current docs).
- Measure what the speech hop adds: critical fact survival with and without it, and where errors cluster (numbers, place names, negation).
- Make it a clearly labeled optional hop in the chain builder. Handle audio size limits, timeouts and failures without silent fallback.
- Do not store user audio beyond what is needed; document retention.

## 7. Workstream F: Production hardening

- **Durable quotas:** per-user or per-session limits stored durably (not in memory), with clear "limit reached" messages and an admin override via environment config.
- **Rate limiting, input size limits, timeouts and retries with backoff** on all provider calls. Distinct, sanitized errors for auth, quota, timeout, invalid output and upstream failures.
- **Cost guard:** a global daily spend cap with a visible blocked state.
- **Logging:** structured logs with no secrets and no raw user messages by default; opt-in debug logging.
- **Privacy:** short in-app notice that messages are sent to third-party providers; configurable retention; a delete-my-data path for stored runs.
- **Security basics:** CORS restricted, security headers, dependency audit, no keys in client bundles, authentication retained for the private deployment.
- **Operational tests:** concurrency test, provider-outage test (mocked), large-input test, and a smoke test against the deployed app.

## 8. Workstream G: Expand the horizon (stretch, in this order, only after A to D pass)

Pick items in order and stop when time runs out. Each must be small, tested and honestly labeled.

1. **Pre-flight "Send-safe" check for authorities.** Paste a message, pick target languages, get a risk report: which critical facts are most likely to mutate, per language, plus a safer rewrite. Reuse the optimizer. This turns the research tool into something an agency could actually use.
2. **Hindi Pitfalls Benchmark.** Package the gold set as a small public benchmark (JSON plus a runner script) so any translation provider can be scored on the same hard cases. Run it on Sarvam and on any other provider you can legitimately and verifiably access, and report results per mutation type. Include a data card describing authorship and limits.
3. **Channel simulation.** Model real distribution channels: SMS length and encoding limits (Unicode messages split into shorter segments), a forwarded-message chain (people truncate and paraphrase), and a voice-note path (via §6 if built). Show how the channel changes survival.
4. **Protected-entity mode.** Lock numbers, phone numbers, times and place names behind placeholders during translation, then restore them, and measure whether this improves survival versus unprotected translation. Report the result either way.
5. **Community review mode.** A shareable review link where native speakers mark facts correct or wrong, feeding the calibration in §3. No account required, anonymous reviewer ID, clear consent text.
6. **Structured alert export.** Export a verified message in a standard alerting format such as the Common Alerting Protocol (verify the current specification before implementing) so output could plug into existing systems.

Do not add features outside this list.

## 9. Testing and verification

- Keep **mocked** provider tests separate from **opt-in live** tests. Missing credentials produce a clear skip or blocked status, never a pass.
- Run the full backend test suite, the frontend build, the gold-set and mutation suites, and a real-HTTP smoke test against the running app. If a deployed environment is reachable, smoke-test it too, and report exactly what you could and could not test.
- Existing 41 tests must still pass; report the new total and any skips.

## 10. Order of work and cut line

Work in this order and update the progress log after each step:

1. Inspect repo and re-verify provider docs
2. A (gold set, checker, mutation tests)
3. C (real evaluation)
4. B (judge, review pack, statuses)
5. D (language matrix)
6. F (hardening)
7. E (speech, optional)
8. G (stretch)

**If time is short, protect this core: A, then C, then the honest status labels from B and D.** A smaller set of verified, honestly labeled results beats a larger set of unverified features. Stop and report rather than shipping anything you could not verify.

## 11. Deliverables and final report

Deliver the updated codebase plus:
- `docs/CHECKER_EVAL.md`, `docs/EVALUATION.md`, `docs/VERIFIED.md`, and a language coverage report
- Updated README, `.env.example` and run/test commands
- A native-speaker review pack and instructions for using it

End with this report:

```
## Phase 2 report
Summary: <2-3 sentences>

Verified (with evidence): ...
Blocked / unverified (reason and what is needed): ...
Checker: recall and precision per mutation type, before vs after
Real evaluation: scenarios, chains, trials per setting, baseline vs optimized (train and hold-out) with CIs; or "blocked" with reason
Judge and human validation: status per language
Language coverage: tested / limited testing / untested
Hardening: what was added, what remains
Stretch items completed: ...
Tests: backend <passed/skipped> · gold <x/y> · mutation suite · frontend build · smoke
Known weaknesses: ...
Next steps: ...
```

## 12. Progress log (update as you go)

**Total steps: 8 · Current step: 1 · Status: not started**

| Step | Status | Notes / changes | Next |
|---|---|---|---|
| 1. Inspect and re-verify docs | ☐ | | |
| 2. A: gold set, checker, mutation tests | ☐ | | |
| 3. C: real evaluation | ☐ | | |
| 4. B: judge, review pack, statuses | ☐ | | |
| 5. D: language matrix | ☐ | | |
| 6. F: hardening | ☐ | | |
| 7. E: speech (optional) | ☐ | | |
| 8. G: stretch items | ☐ | | |

**Baseline (before Phase 2):** 41 tests passing; checker recall and precision unmeasured; research results synthetic.