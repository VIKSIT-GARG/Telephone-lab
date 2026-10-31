# Provider verification — 31 October 2026

Checked the official Sarvam documentation before implementing the provider:

- https://docs.sarvam.ai/api-reference/chat/chat-completions-v1
- https://docs.sarvam.ai/api/token-factory/chat-completions
- https://docs.sarvam.ai/api/token-factory/models/sarvam-105b

## Implemented contract

The official reference documents POST `https://api.sarvam.ai/v1/chat/completions` with `api-subscription-key` authentication. The client uses the documented `messages`, `model`, `temperature`, `max_tokens`, `seed`, `reasoning_effort` and `response_format` fields. It reads `choices[0].message.content`, requires a `stop` finish reason and retains the full JSON response in run logs.

Model default: `sarvam-105b`. Sarvam-M is deprecated. The V1 reference also lists `sarvam-105b-conversations`; this project does not use it by default. The flagship page states a 128K context, temperature 0–2 and tier-dependent completion limits. We cap output at 2048 tokens and explicitly set reasoning_effort to JSON null, as documented for disabling thinking. Judge/extraction requests use JSON object mode and strict application-side validation. Seed is beta/best-effort; deterministic live output is not promised. HTTP errors, truncation and invalid JSON are terminal visible failures. Rate limits depend on account/tier; no guessed rate is encoded and no automatic retry spends more calls.

The model page claims 10 major Indian languages plus English, with native-script and code-mixed input. The UI conservatively exposes Hindi, Tamil, Bengali, Marathi and English as prompted retelling targets; actual quality and account availability have NOT been tested here. This is a chat model, not a dedicated dialect API. No Bhojpuri or dialect fidelity claim is made. All mock outputs are English renderings, irrespective of target label.

Judging uses the same verified Sarvam endpoint and a different prompt at temperature zero. SARVAM_JUDGE_MODEL can select another supported model, but same-model grading bias remains by default. No second vendor API is assumed.

## Initial-build limitations (superseded by the live studio update below)

No API key was supplied. Therefore no real API call, live mutation, cost, latency, model access or native-language quality is verified. The live client is covered with HTTP mock tests; those are not a connectivity test. Run a one-trial live experiment after configuring the environment before claiming real provider success.

The reference and model guide differ in their default reasoning/temperature descriptions; explicit request parameters avoid depending on those defaults. A returned provider error is surfaced and saved without fallback.

Speech APIs were not implemented; optional phase skipped to keep the core demo reliable.

## Live studio update — 31 October 2026

The owner supplied a Sarvam API key and authorized live usage. A real V1 chat completion returned HTTP 200 and a visible completion. The key is stored only as a hosted runtime secret. The custom-message studio now uses the same verified endpoint and model with strict JSON Schema outputs (the documented response_format=json_schema contract), explicit temperature zero, reasoning disabled and a 2,400-token output cap. It performs fact extraction, anchored translation, back-translation and independent-prompt verification; one repair attempt is allowed. This establishes API connectivity, not native-speaker quality or general preservation guarantees. The earlier recorded research evaluation remains synthetic and unchanged.

## Phase 2 re-verification — 31 October 2026

Official sources re-read before changes:

- V1: https://docs.sarvam.ai/api-reference/chat/chat-completions-v1
- V2: https://docs.sarvam.ai/api-reference/chat/chat-completions-v2
- Token Factory: https://docs.sarvam.ai/api/token-factory
- Gemma family mapping: https://docs.sarvam.ai/api/token-factory/migrations/from-openrouter/overview
- Gemma model limitations: https://docs.sarvam.ai/api/token-factory/models/gemma-4-31b
- Prices/rate limits: https://docs.sarvam.ai/api/getting-started/pricing

The translator remains `sarvam-105b` on V1. The independent-family judge uses `gemma4` on `POST https://api.sarvam.ai/v2/chat/completions` with the same server-side subscription key and a structured rubric. Gemma is a different model family (Google Gemma 4 31B), served by the SAME provider; it is not an independently operated provider and is not specifically tuned for Indian languages. Do not equate model independence with native-speaker validation.

V2 documents Gemma reasoning as off unless reasoning_effort is set; that field is omitted for Gemma. Structured JSON Schema output is documented. A real Gemma rubric call succeeded with 2/3 agreement on sampled critical facts (N=3 facts, one translation); this is evidence of access, not judge calibration. The model guide/overview differ on context length (131K vs 256K); this app does not rely on that limit and bounds inputs much lower.

Prices used in integer micro-INR accounting, checked on the official pricing page: Sarvam-105B INR 15 input / 60 output per million tokens; Gemma4 INR 35 input / 90 output. Cached-input discounts are intentionally not used for conservative accounting. Reasoning tokens, if any, count as output. Estimates concern documented token charges, not tax or a verified billing statement. Prices can change; update the guard and verification date together.

Published pay-as-you-go limits are 60 requests/minute for Sarvam-105B and 50 for Gemma/default models, enforced per account. Actual account dashboard limits may differ. The extended local study paces fresh calls to at most 40/minute and caps concurrency at six; hosted studio concurrency remains four with durable per-user quotas. Retries for transient HTTP failures and network/timeouts are bounded to three attempts with exponential backoff, and every attempt consumes its own reservation. Auth/credit errors are surfaced, never replaced by mock output.

Speech APIs were not integrated: the required prior evidence gates (human-reviewed gold/native validation and sufficient language coverage) are not complete. No voice API claims are made.
