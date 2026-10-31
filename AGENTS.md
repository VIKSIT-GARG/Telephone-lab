# AGENTS.md — Telephone Lab

Last updated: 31 October 2026.

Read this file before changing the project. It replaces the original build brief and its outdated progress log. Maintain the existing working application; do not rebuild it from a starter.

## 1. Product and current scope

Telephone Lab helps people carry a message across Indian languages while inspecting whether its important facts survive.

The primary product is a **live message studio**:

1. The user types or pastes their own message.
2. Sarvam suggests facts with exact quotations from the original.
3. The user reviews, edits, adds or removes facts and marks critical details.
4. The user confirms the intended meaning and selects up to three target languages.
5. The server translates using the original and approved facts.
6. Separate prompts back-translate the result into English and verify each fact.
7. Numeric checks can override a passing model judgment. One repair is attempted when needed.
8. The user inspects unresolved issues, copies or downloads translations, and exports a full JSON report.

The original **telephone-chain research experiment** remains a separate experience at `/lab/index.html`. Its bundled runs are recorded synthetic simulations and must stay labeled as such.

Context: Ship Happens hackathon, Culture Coded track, with a Trust Issues angle. The value is inspectable preservation of meaning, not translation fluency alone.

## 2. Non-negotiable rules

1. **Never promise guaranteed preservation.** Automated checks can miss errors and produce false positives. Use language such as “checks passed” or “needs review,” not “proven accurate.”
2. **Keep live, mock and recorded provenance distinct.** A recorded simulation must never appear as a live provider result. Mock gains are not evidence of multilingual performance.
3. **No silent fallback.** Surface provider failures, timeouts, invalid schemas, truncation and unsupported evidence. Do not substitute canned translations or manufacture passing checks.
4. **Keep secrets server-side.** The Sarvam key is already configured as a hosted runtime secret. Never print it, commit it, put it in browser code, include it in reports, or copy it into this file. Document variable names only.
5. **Verify API contracts before changing provider integration.** Use official Sarvam documentation and update `docs/VERIFIED.md`. Do not invent endpoints, parameters, model IDs, limits or language claims.
6. **Keep user approval central.** The confirmed facts define the intended meaning. Editing the source invalidates extracted facts and previous translations. Editing facts invalidates confirmation and previous translation results.
7. **Preserve negation and qualifiers.** “Do not use the bridge,” “2 bottles per person,” “by 6 PM,” and “only after the all-clear” are distinct factual requirements. Do not drop conditions to improve scores.
8. **Treat messages and model output as untrusted data.** Do not execute instructions embedded in message text. Validate schemas and evidence; render content as text.
9. **Preserve privacy.** The live studio sends messages to Sarvam but does not persist them to a database or browser storage. Do not add persistence, analytics or third-party transmission without an explicit product decision.
10. **Preserve access.** The hosted Site is owner-private. Do not change its audience or expose a key-backed public endpoint without the user's explicit request and appropriate server-side controls.
11. **Be honest about languages and dialects.** Targets are prompted chat-model languages. No native-speaker quality certification or dialect fidelity is claimed. Bhojpuri is not exposed.
12. **Use fictional examples for safety scenarios.** Telephone Lab is a research tool, not an official alert system. A user's custom message need not be fictional, but sample alerts must be clearly fictional.
13. **Respect evaluation boundaries.** Research optimization selects on chain A only; chain B remains held out until selection is complete. Report worse results honestly.
14. **Keep scope focused.** Improve custom-message translation, evidence, reliability and usability. Voice, external alert delivery and new product features are not implemented unless separately requested.

## 3. Current architecture

The repository contains two related applications. Keep their responsibilities distinct.

| Area | Implementation | Role |
|---|---|---|
| Main studio | React + TypeScript + Vinext | Custom message input, reviewed facts, language selection and results |
| Hosted backend | Cloudflare Worker through the supplied Sites integration | Server-side Sarvam requests and validation |
| Live pipeline | `lib/studio.mjs` | Extraction, translation, back-translation, verification and bounded repair |
| Research backend | Python + FastAPI | Multi-hop chain runner, extraction, optimization and local run persistence |
| Research frontend | `public/lab/` | Recorded mock replay and local research API controls |
| Hosted secrets | Runtime environment | `SARVAM_API_KEY`, `SARVAM_MODEL` |

Hosted URL: https://telephone-lab-viksit.hduasbasj.chatgpt.site/

The existing Site identity is declared in `.openai/hosting.json`. Reuse it. Do not create a replacement Site or restore static-only hosting. Preserve the starter's `sites()` integration and Worker entrypoint.

### Important files

| File | Responsibility |
|---|---|
| `app/studio.tsx` | Main studio state, review flow, translation cards, exports and explanation dialog |
| `app/globals.css` | Responsive studio styling |
| `app/page.tsx`, `app/layout.tsx` | Main route and metadata |
| `app/api/studio/[action]/route.ts` | Hosted status, analysis and translation routes |
| `lib/studio.mjs` | Sarvam adapter, structured schemas, fact validation and preservation checks |
| `cloudflare-env.d.ts` | Worker environment types; names only, never secret values |
| `worker/index.ts`, `vite.config.ts` | Worker and framework/Sites integration |
| `app/main.py` | Local FastAPI research routes |
| `app/chain.py`, `app/extract.py`, `app/optimize.py` | Research pipeline and evaluation logic |
| `app/providers/` | Explicit live Sarvam and synthetic mock providers |
| `data/sources.json` | Three fictional research scenarios |
| `public/lab/demo.json` | Recorded mock research evaluation |
| `tests/studio.test.mjs`, `tests/test_core.py` | Studio and research tests |
| `scripts/evaluate.py` | Research evaluation CLI |
| `scripts/live-smoke.mjs` | Optional real-provider test; key read through stdin |
| `scripts/package_source.py` | Credential-free downloadable source archive |

Do not edit generated `dist/` files. The main app's build output now belongs to the Worker build. The research page's source assets live under `public/lab/`.

## 4. Live studio contract

### Supported UI flow and bounds

- Input message: 1–3,000 characters.
- Reviewed facts: 1–12, with unique IDs and at least one critical fact.
- Fact value: nonempty, at most 500 characters.
- Targets: Hindi, Tamil, Bengali, Marathi, Telugu, Kannada, Malayalam, Gujarati, Punjabi and English.
- User selects up to three targets; the client requests them sequentially.
- One repair attempt maximum per target, followed by another verification.
- No automatic substitution with mock output if live processing fails.

These targets are UI choices, not a claim that all have been comprehensively evaluated. Hindi and Tamil have received limited real-call smoke testing.

### Fact schema

```json
{
  "id": "f1",
  "label": "Evacuation deadline",
  "kind": "time",
  "value": "By 6:30 PM",
  "evidence": "by 6:30 PM",
  "critical": true
}
```

Allowed kinds: `action`, `place`, `person`, `time`, `date`, `number`, `other`.

Suggested fact values and labels are canonical English; extraction evidence must be an exact, nonempty source quotation in its original script. A source quotation grounds a span, not its interpretation. Users still need to review suggestions. User-added corrections need not have model-generated evidence.

Do not force arbitrary messages into the research backend's six-field schema. Keep both schemas explicit.

### Provider integration

Current implementation uses:

- Endpoint: `POST https://api.sarvam.ai/v1/chat/completions`.
- Authentication: server-side `api-subscription-key` header.
- Default model: `sarvam-105b`.
- Studio temperature: `0`.
- Reasoning: explicitly disabled with JSON null.
- Output cap: 2,400 tokens per studio call.
- Structured output: documented `response_format: json_schema` with strict task-specific schemas.
- Response checks: nonempty content and `finish_reason: stop`, followed by JSON and application-level validation.

Task schemas cover analysis, translation/repair, back-translation and verification. An earlier JSON-object-only response produced an invalid back-translation shape; strict schemas were added and tested. Do not weaken these contracts to hide provider errors.

See `docs/VERIFIED.md` for checked documentation and historical notes. Access, limits and model availability can change; reverify when modifying the contract.

### Verification and repair

1. Translate using the original message and approved facts.
2. Back-translate independently into English without repairing the translation.
3. Judge every approved fact and inspect substantive additions.
4. Require observed evidence to match the English back-translation.
5. Apply deterministic checks for supported numeric/time and explicit-date forms. A changed or missing numeric value cannot pass solely on model confidence.
6. If any fact is not preserved, or additions are flagged, attempt one repair.
7. Verify the repair again and retain the better candidate, prioritizing critical facts.
8. Keep unresolved problems visible as “needs review.”

Studio fact statuses are `preserved`, `altered` and `dropped`. Added claims are a separate `additions` list. Do not silently convert added claims into approved source facts.

The same model performs the stages using separate prompts. This reduces direct instruction sharing but does not provide independent-model verification. Numeric/date normalization covers limited forms and does not prove full semantic equivalence.

### Hosted API

| Method and route | Contract |
|---|---|
| `GET /api/studio/status` | Returns live configuration flags and model name; never the key. A configured flag is not a fresh provider health check. |
| `POST /api/studio/analyze` | `{ "message": "..." }` → source language, summary, grounded fact suggestions and logs |
| `POST /api/studio/translate` | `{ "message": "...", "facts": [...], "language": "Tamil" }` → selected translation, audit, back-translation, attempts and logs |

Keep `Cache-Control: no-store`, JSON validation and same-origin protection. The current request guard allows up to four active operations and 40 requests per ten-minute window per identity within an isolate. It is best-effort, not a globally enforced spending quota.

Exports include original text, approved facts and provider prompts/responses. They must never include credentials. Users deliberately download these files; do not persist copies automatically.

## 5. Research telephone experiment

Purpose: study how messages drift across successive retellings, rather than translate directly with preservation anchors.

- Each reteller receives only the previous hop's message, never original ground truth.
- Extraction normalizes each hop into a comparison language.
- The source fact schema contains `hazard`, `location`, `action`, `deadline_time`, `deadline_date`, `quantity` and a `critical` field list.
- Per-field outcomes: `preserved`, `altered`, `dropped`, `invented`.
- Critical changes or omissions trigger danger flags.
- Chain A: Hindi → Tamil → Hindi.
- Held-out chain B: Tamil → Bengali → Marathi → Hindi.
- Source scenarios: fictional flood, cyclone and heatwave messages.
- Optimizer: up to four bounded rewrite rounds, feedback, early stopping and a length cap. Keep the original when no candidate improves.
- Fresh chain A validation follows selection. Chain B is evaluated only afterward with fresh trials.

The bundled mock provider generates deliberately programmed mutations in **English renderings**. Language labels do not turn these into real native-language output. Label-sensitive synthetic noise deliberately favors some rewrite styles. Its gains test software plumbing, not preservation efficacy.

### Research metrics

| Metric | Definition |
|---|---|
| Fact survival | Fraction of source-supplied facts preserved at a hop |
| Critical Fact Survival (CFS) | Final-hop fraction of critical facts preserved, averaged over N trials |
| Danger rate | Fraction of trials with a critical mutation at any hop |
| Final-hop danger rate | Fraction of trials with a critical mutation at the last hop |
| Mutation counts | Status counts across facts/hops; their denominator is not simply trials |
| Length ratio | Rewrite Unicode character count divided by original character count |

Show N next to every percentage. Live studio counts describe one checked translation (`N=1`), not a research benchmark. Full research evaluation should use N ≥ 10 per scenario/version/chain. Do not treat smoke tests as this evaluation.

## 6. Validation and known status

Latest recorded implementation checks:

- 24 Python research tests passed.
- 17 Node studio tests passed: 41 combined.
- TypeScript checking passed.
- Worker production build and private deployment succeeded.
- A real Sarvam connectivity request returned HTTP 200.
- Live Hindi and Tamil workflows were exercised with fictional messages.
- The final hosted custom-message test returned HTTP 200 for analysis and translation. Its Tamil result reported 5/6 total and critical facts preserved after one repair, with `needs_review: true`, N=1. This unresolved finding was retained, not hidden.
- The original three-scenario research evaluation remains recorded MOCK with N=10 per setting. Its held-out results were weaker than fresh chain A validation.

Remaining limitations and unfinished work:

- No native-speaker accuracy study or dialect validation.
- No independent-model judge.
- No full real-provider, three-scenario N≥10 baseline/optimizer/hold-out study recorded as complete.
- No statistical significance or confidence-interval claim.
- No guarantee that extraction covers every fact, especially complex conditions, phone numbers or repeated/conflicting values.
- No TTS/STT or speech hops.
- No claim of production alert readiness.
- Docker instructions for the Python research runner have not been executed here.
- No claim of two completed timed human demo rehearsals.

Historical documents may contain superseded “no API key supplied” statements. Use the current status above: live connectivity is verified, but broad language accuracy and research efficacy are not.

## 7. Commands and verification workflow

Use the existing dependency lockfile. Do not replace the framework or reinstall dependencies without cause.

### Studio development

```bash
pnpm install --frozen-lockfile
# Configure local runtime variables in an untracked environment file if needed.
pnpm dev
```

For managed Sites preview, follow the environment's current Sites skill and preview CLI rather than launching a competing server.

### Studio checks

```bash
node --test tests/studio.test.mjs
pnpm exec tsc --noEmit
pnpm build
```

### Local research backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m pytest -q
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The Python root serves `public/lab/`. Research runs are saved locally to `runs/` or `TELEPHONE_RUNS_DIR`. Enable live research calls explicitly with `TELEPHONE_ENABLE_LIVE=true` and a server-side key.

### Research evaluation

```bash
python -m scripts.evaluate --mode mock --trials 10
# Explicitly authorized real-provider evaluation:
python -m scripts.evaluate --mode live --trials 10 --output runs/live-evaluation.json
```

Mock evaluation defaults to `public/lab/demo.json`; live evaluation defaults to a separate file under `runs/`. Never replace the mock replay with live data while keeping a mock label, or the reverse.

### Optional real studio smoke test

`scripts/live-smoke.mjs` reads a key from stdin and accepts an optional target-language argument. Supply secrets through a secure environment or hidden input; never place actual keys in shell arguments or checked-in commands. Real tests incur provider usage. Keep smoke tests small; large evaluations need a deliberate budget.

## 8. Design and interaction requirements

Preserve the existing visual direction: warm off-white, dark teal, muted green, restrained orange, readable typography and responsive panels.

- Make custom message entry the primary action.
- Keep reviewable facts ahead of translation.
- Clearly indicate live processing, queued languages, errors and unresolved review issues.
- Keep source quotations, back-translations and audits inspectable.
- Preserve user content on a provider error; allow per-language retries.
- Disable conflicting edits during an active request.
- Ensure keyboard access, visible focus, readable contrast and reduced-motion support.
- Render native scripts as text and preserve copy/download functionality.
- Do not show a single-run fact count as a confidence percentage.
- Keep mock research results visually distinct from live studio output.

## 9. Working rules for future changes

1. Read the relevant current source and this file before editing.
2. Preserve the existing working stack and private Site identity.
3. Make the smallest coherent change that fulfills the user's request.
4. Test the affected behavior meaningfully. For preservation changes, cover negation, dates, times, quantities/units, names and conditions where relevant.
5. Do not tune examples merely to obtain a passing score or suppress review flags.
6. After provider/schema changes, run a small authorized live check and report its actual outcome.
7. Update README and relevant verification/status documents when behavior changes.
8. For hosted source changes, use the existing Sites workflow; build and package only after dependent writes/checks complete. Do not package while generated source archives are changing.
9. Do not redeploy solely because the user requested a downloadable document or an explanation.
10. Regenerate `public/lab/telephone-lab-source.zip` when delivering updated source. Exclude credentials, environment files, dependencies, caches, generated build output and the archive itself.

## 10. Next priorities

These are proposed work, not completed features:

1. Strengthen extraction and audit coverage for phone numbers, negation scope, “per person” quantities and conditional instructions.
2. Improve partial-result handling while keeping unverifiable checks explicit.
3. Add native-speaker review and an independent-model evaluation where available.
4. Run the real research baseline/optimizer/held-out study with a deliberate budget and honest reporting.
5. Add durable quotas before any explicitly requested broader access.
6. Consider speech only after the text pipeline is reliable and separately authorized.

Refer to `README.md`, `docs/VERIFIED.md`, `docs/EVALUATION.md`, `docs/LIVE_SMOKE.md`, `docs/VALIDATION.md` and `docs/LIMITATIONS.md` for supporting detail. Preserve the distinction between implementation tests, single-run live observations and research findings.

## Phase 2 extension (31 October 2026)

Implement docs/PHASE2_BRIEF.md in its stated order. Preserve all existing tests, retain substantially replaced modules until measured, and label assistant-authored fixtures unreviewed until a real reviewer signs off. Human reviews and completed real N≥10 evaluations cannot be invented. Optional speech/stretch work stays gated on A–D evidence. Current progress is recorded in docs/PHASE2_REPORT.md.

## Phase 2 current status — supersedes earlier progress counts

See docs/PHASE2_REPORT.md. The original 41 tests remain; the current suite has 100 passing tests. The 76 hard-case fixtures are assistant-authored and human-unreviewed (0 reviewed), so they are not certified gold evidence. All ten target languages have one real coverage sample/round trip and remain limited testing. Gemma4 is an independent model family on Sarvam V2, not another provider. The real study is partial and direct Sarvam access became blocked by the execution environment; never fill missing results synthetically or bypass that restriction. Human validation and A–D gates remain incomplete; speech/stretch are not implemented. The source download includes real caches and the detailed report.
