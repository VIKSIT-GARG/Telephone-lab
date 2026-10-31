# Build validation

- Python 3.12: 24 tests passed. Covers Unicode/time/date/unit normalization, schema validation, critical sets, altered/dropped/invented facts, semantic negation handling, previous-hop isolation, optimizer budget/length/stop behavior, hold-out separation, provider response contract, missing-key/upstream failures, secret-free logs and API persistence.
- `node --check dist/app.js` passed.
- All three mock scenarios evaluated with N=10 per version/chain; raw JSON and calculated summary included.
- Browser QA: initial rendering, scenario change, held-out chain switch, rewritten journey, per-hop inspection, trial selection and optimizer/methodology dialogs checked.
- Static demo is hosted separately from the Python API. Fresh mock/live modes require running the backend locally on localhost/127.0.0.1.
- Live connectivity, multilingual quality, voice and Docker execution remain unverified. No credentials were supplied; no real-call results are claimed.

Test installation emitted a Starlette deprecation warning for its httpx-backed TestClient; all assertions passed. requirements.txt specifies compatible version ranges rather than a full dependency lock. Versions used: FastAPI 0.162.0, Uvicorn 0.54.0, HTTPX 0.28.1, python-dotenv 1.2.4, pytest 9.2.0, Pydantic 2.14.1, Starlette 1.10.0.

## Live studio update

- 17 additional Node tests passed, covering grounded extraction, dates, numbers/time, negation, schema failures, added claims, bounded repairs, unresolved failures and secret-free provider errors.
- TypeScript checking passed; Worker build passed.
- The supplied key completed a real Sarvam V1 chat call (HTTP 200).
- Hosted custom-message endpoints are now implemented; live end-to-end validation is reported separately after deployment.
- The main frontend supports custom input, editable/critical facts, ten prompted language targets (up to three per request flow), back-translations, evidence inspection, per-language retry, copy/text export and full JSON export.
