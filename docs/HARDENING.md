# Phase 2 hardening

## Implemented

- Private hosted dispatch authentication retained. The application does not change its audience.
- D1 atomic conditional-UPSERT quotas: per-user request-window and daily provider-call limits, plus a global UTC daily estimated token-spend cap.
- Defaults: 40 requests/10 minutes, 120 provider attempts/user/day, INR 25 global/day. Server environment variables are the administrative override; no browser override exists.
- Each provider attempt reserves conservatively using UTF-8 prompt bytes and maximum completion tokens at verified prices. Reported token usage refunds unused reservations. Unknown usage retains the bound. Failed attempts and retries still count toward call limits. Unknown model prices fail closed.
- Caps concern estimated documented token charges (pre-tax), not verified invoices. Cached-token discounts are not needed for the conservative guard. Account-wide external usage is outside this app's accounting. The CLI research runner has a separate local cap/ledger and must not be confused with hosted D1 accounting.
- Storage unavailable → explicit blocked state. No in-memory quota fallback.
- Four simultaneous hosted provider operations per isolate, plus durable request/call/spend limits across isolates.
- Streaming JSON body limit of 64 KB, message length limit 3,000 characters, reviewed-fact bounds and same-origin JSON requests.
- Provider timeout of 75 seconds per attempt; up to three attempts with exponential backoff for transient 429/5xx/network failures. Authentication/credit errors are surfaced. No mock substitution.
- Distinct structured API error codes for input, origin, storage/quota, provider auth/quota, timeout, invalid output, concurrency and upstream problems.
- Structured provider event logs contain task/model/status/duration/attempt only. No raw messages or keys in server logs by default. Raw prompts/responses are held in a downloadable report only when the user opts in; research caches are explicitly recorded fictional-study data.
- Anonymous reviews store judgments/comments, hashes and dates, never raw studio source/translation text. Retention defaults to 30 days (configurable 1–90); expired records are hidden/pruned on access. A delete-my-reviews endpoint is available. Quota records expire separately to prevent deletion from resetting limits.
- Security headers: MIME sniffing protection, same-origin referrers, disabled camera/microphone/geolocation, production HSTS and CSP. CSP retains inline script/style allowances required by framework bootstrapping; it is not a nonce-based strict CSP.
- Patched production dependency audit: zero known advisories at the recorded registry snapshot; see DEPENDENCY_AUDIT.md.

## Verification / limits

SQLite tests exercise the same quota SQL, concurrent reservations and persistence across reopened database connections. Tests also cover bounded provider outages/retries, missing storage, estimates/refunds, large streaming inputs, review integrity and absence of raw content in default logs. Hosted D1 migrations and the deployed endpoints still require the deployment smoke test reported in PHASE2_REPORT.md.

Direct executor HTTP access to the managed preview URL timed out through the environment's proxy; browser preview worked. No alternate network route or permission bypass was used. Hosted service HTTP testing is used separately.

Remaining production work: external load testing, independent security review, monitored backup/restore, nonce-based CSP if supported, signed/verified reviewer identity if needed, stronger retention scheduling than prune-on-access, and billing reconciliation. Daily quotas do not make the tool ready for real emergency alerts.
