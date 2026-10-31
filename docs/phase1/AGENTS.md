# AGENTS.md: Telephone Lab

A hackathon build (Ship Happens, Culture Coded track, with a Trust Issues angle). You are a coding agent. Build the working project described here in roughly 24 hours. Read this whole file before writing code.

---

## 1. What we are building

**Telephone Lab** measures and fixes how public-safety messages mutate when they are passed person to person across Indian languages.

- A flood warning is retold through a chain of Sarvam-powered "speakers" in different languages and dialects (for example Hindi → Bhojpuri → Tamil → Hindi).
- After every hop, the system extracts the critical facts (hazard, place, action, deadline, numbers) and checks which ones **survived, changed, dropped, or were invented**.
- An optimizer then rewrites the original message, runs it through the chain repeatedly, and keeps the version whose critical facts survive best.

**The demo moment:** one message visibly mutating into a dangerous one ("leave by 6 PM" → "leave tomorrow"), then the optimized version surviving the same chain intact, with a measured number to prove it.

**Why it matters (for the pitch):** in a flood or cyclone, a distorted time or place can cost lives, and almost nobody tests how warnings degrade across languages and word-of-mouth.

## 2. Non-negotiable rules

1. **No invented API details.** Verify Sarvam's current docs (endpoints, supported languages, model names, limits) before coding against them. Record what you verified in `docs/VERIFIED.md`.
2. **No fake results presented as real.** A mock or recorded mode is allowed for reliability, but it must be **labeled on screen and in the API** ("Recorded run" / "Mock"). Never show scripted mutations as live output.
3. **No silent fallback.** If a Sarvam or LLM call fails, surface the error. Do not quietly substitute canned text.
4. **Secrets stay in environment variables.** Never commit keys, never print them, never send them to the frontend. Provide `.env.example`.
5. **Be honest about dialects.** If Bhojpuri (or any dialect) is not directly supported by the verified API, use the closest supported languages or an instructed-style retelling, and state this plainly in the README and the demo. Do not claim dialect accuracy that no native speaker has checked.
6. **Messages are fictional.** Use clearly fictional sample warnings. This is a research and demo tool, not an official alert system. Say so in the README.
7. **Hold-out honesty.** The optimizer must be tested on a chain or language order it did not train on (see §6). Report the numbers as they come out, including bad ones.
8. **Keep scope small.** Do not add features outside this file. If you have spare time, polish the demo before adding anything new.

## 3. Pipeline

```
Source message + ground-truth facts (JSON)
        │
        ▼
 ┌─ Hop 1: retell in language/dialect A (Sarvam) ─┐
 │  optional speech hop: TTS → STT (adds real noise)│
 │  extract facts → compare to ground truth         │
 └──────────────────────┬───────────────────────────┘
                        ▼
                   Hop 2 … Hop N  (each starts from the previous hop's text)
                        │
                        ▼
        Per-fact survival report + mutation highlights
                        │
                        ▼
      Optimizer loop → improved message → re-run chain → compare
```

### 3.1 Ground-truth fact schema
Each source message ships with structured facts. Suggested fields (adapt as needed):

```json
{
  "hazard": "flood",
  "location": "Rampur village, near the river bank",
  "action": "evacuate to the school building",
  "deadline_time": "18:00",
  "deadline_date": "today",
  "quantity": "water expected to rise 2 metres",
  "critical": ["location", "action", "deadline_time", "deadline_date"]
}
```

Mark which facts are **critical**. The headline metric only counts those.

### 3.2 Retelling
- Each hop gets only the previous hop's text, never the original.
- The retelling prompt should ask the speaker to retell the message naturally *as a person would pass it on*, in the target language or dialect, without a literal word-for-word translation. This is what produces realistic drift.
- Use a fixed seed or low-but-nonzero temperature where the API allows, and record every prompt, response, model name and parameter used.

### 3.3 Fact extraction and comparison
- To compare across languages, **normalize first**: bring each hop's text back to one comparison language (for example English or Hindi) and extract facts into the same JSON schema.
- Compare to ground truth per fact with one of these outcomes: `preserved`, `altered`, `dropped`, `invented`.
- Use **deterministic checks** for times, dates and numbers (normalize "6 PM", "शाम 6 बजे", "18:00" to one form) and an LLM judge only for fuzzy fields like location and action.
- Use a **different model or prompt for judging than for retelling** where possible, to reduce self-grading bias. Log judge outputs.
- Flag **dangerous mutations**: any change that flips or removes a critical action, time, date or place.

### 3.4 Optional speech hop
If time allows, pass one hop through text-to-speech then speech-to-text (Sarvam's voice APIs, after verifying them). This adds realistic transcription noise and is a strong demo element. Skip it if it threatens the core loop.

### 3.5 Optimizer
Goal: raise **Critical Fact Survival (CFS)** without making the message long or unnatural.

- Generate candidate rewrites of the source message using a small set of strategies, for example:
  - Short sentences, one fact per sentence
  - Numerals plus words for times and numbers ("6 PM / शाम 6 बजे")
  - Repeating the single most important fact
  - Avoiding idioms and relative time words ("in a bit", "by evening")
  - Explicit date anchors ("today, Saturday")
- Run each candidate through the chain several times (the process is stochastic) and compute mean CFS.
- Keep the best candidate, feed back what mutated, and iterate up to a fixed budget (for example 4 rounds). Stop early if target CFS is reached.
- Enforce a **length cap** so the optimizer cannot win by writing an essay.

## 4. Metrics

| Metric | Definition |
|---|---|
| Fact survival (per hop) | Share of facts `preserved` at that hop |
| **CFS** | Share of **critical** facts `preserved` after the final hop, averaged over N trials |
| Danger rate | Share of trials with at least one dangerous mutation |
| Mutation type counts | altered / dropped / invented, per fact |
| Length ratio | Optimized message length divided by original |

Always report **N (number of trials)** next to every percentage. Never report a bare percentage from one run.

## 5. Suggested stack

Keep it boring and fast to build. Use the repo's existing stack if there is one; otherwise:

- **Backend:** Python, FastAPI. A single `chain.py` (pipeline), `extract.py` (facts and comparison), `optimize.py`, `providers/` (Sarvam and LLM clients behind a small interface so mocks are easy).
- **Frontend:** one simple page (React or plain HTML plus JS) that shows the chain as a vertical "telephone line", with mutated words highlighted in red and a before/after CFS comparison.
- **Storage:** JSON files for runs. Recorded runs are replayable for the demo and labeled as recorded.
- **Tests:** unit tests for fact normalization (times, dates, numbers), comparison logic, and the optimizer's stop conditions, using mocked providers.

## 6. Evaluation plan

1. Create **3 fictional source messages** (for example a flood evacuation, a cyclone shelter notice, a heatwave advisory).
2. **Baseline:** run each original through a chain of at least 3 hops, N ≥ 10 trials per message. Record CFS and danger rate.
3. **Optimize** each message on **chain A**.
4. **Hold-out test:** run the optimized message on **chain B** (different language order and, if possible, different hop count) with fresh trials.
5. Report baseline vs optimized on both chains. If the hold-out result is worse than the training chain, say so; that is a real finding.
6. Pick **one clear example** of a dangerous mutation and its fix for the demo.

## 7. Phases (time-boxed; update §10 after each)

| # | Phase | Target time | Done when |
|---|---|---|---|
| 1 | Verify Sarvam and LLM docs, set up repo, `.env.example`, provider interface with mocks | 1 h | One real call works, or the blocker is documented |
| 2 | Source messages, fact schema, normalization and comparison with tests | 2 h | Tests pass on times/dates/numbers |
| 3 | Chain runner: multi-hop retelling with logging | 2 h | A real 3-hop run saved to JSON |
| 4 | Extraction and per-hop survival report | 2 h | Mutations flagged on a real run |
| 5 | Optimizer loop with length cap and hold-out | 3 h | Baseline vs optimized numbers produced |
| 6 | Frontend: telephone-line view, red mutation highlights, before/after chart | 4 h | The demo flow works end to end |
| 7 | Optional speech hop | 2 h | Only if phases 1 to 6 are solid |
| 8 | Demo polish: recorded run, 90-second script, README, limitations slide | 2 h | Rehearsed twice |

Build one phase at a time. When you rewrite something substantial, keep the previous version (for example `optimize_v1.py`) until the best one is confirmed, then clean up.

## 8. Demo script (90 seconds)

1. State the problem in one sentence: warnings mutate across languages and word of mouth.
2. Show the original message and its ground-truth facts.
3. Run the chain. Watch the facts degrade hop by hop. Pause on the dangerous mutation in red.
4. Show the optimized message and run the same chain. Facts survive.
5. Show the numbers: baseline vs optimized CFS and danger rate, with N, and the hold-out result.
6. Close with the honest limits: dialect coverage, simulated speakers rather than real people, and what a real study with native speakers would add.

## 9. Don'ts

- Don't claim real dialect fidelity without verification.
- Don't present recorded or mock output as live.
- Don't report percentages without trial counts.
- Don't let the optimizer inflate message length past the cap.
- Don't tune only on the test chain; keep a hold-out.
- Don't commit secrets or print keys.
- Don't build features outside this file before the core loop and demo are solid.

## 10. Progress log (updated 31 October 2026)

**Total phases: 8 · Implementation complete for core phases · Live verification blocked on credentials**

| Phase | Status | Notes / changes | Next |
|---|---|---|---|
| 1. Docs, setup, providers | Implemented; live blocked | Current official docs checked; provider adapter and environment template ready | Add Sarvam key and smoke-test access |
| 2. Facts and comparison | Complete | Three scenarios; deterministic normalization and independent judge prompt; tested | Native-speaker review |
| 3. Chain runner | Complete in mock; live unverified | Multi-hop input isolation and full logging | Save a real 3-hop run after key setup |
| 4. Extraction and report | Complete in mock; live unverified | Evidence, status labels and critical-danger flags | Validate against real multilingual messages |
| 5. Optimizer and hold-out | Complete in mock | Length cap, budget, feedback and fresh unseen-chain evaluation | Repeat with live provider |
| 6. Frontend | Complete | Responsive telephone line, inspection, charts, replay, export and local API controls | User review |
| 7. Speech hop (optional) | Skipped | Intentionally omitted | Only after live text validation |
| 8. Demo polish | Complete; human rehearsal pending | README, recorded mock experiment, script and limitations notes | Timed human rehearsals |

**Baseline and optimized numbers:** See docs/EVALUATION.md. All current results are synthetic MOCK, N=10 per setting; they are not multilingual findings.

**Verified Sarvam capabilities:** See docs/VERIFIED.md for exact checked endpoint, models, limits and documentation links. Live calls remain unverified because no key was supplied.

## 11. User-authorized live message studio extension

The user explicitly expanded scope to custom messages, fact preservation and live translation, and supplied a Sarvam key. The main page now implements this flow with editable grounded facts, critical flags, up to three target languages, independent-prompt back-translation/verification, numeric/date checks and bounded repair. The previous research demo is retained separately at public/lab and stays labeled recorded mock. A live Hindi pipeline smoke test extracted seven facts and returned a checked result after one repair (N=1); see docs/LIVE_SMOKE.md. Optional speech is still omitted.
