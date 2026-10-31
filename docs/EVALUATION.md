# Real research evaluation — Phase 2

Status: **blocked**. Full protocol complete: **false**. Recorded real API observations remain distinct from the Synthetic demo.
Date: 2026-10-31T07:39:03.453Z.

Protocol frozen in scripts/phase2/protocol.json before real requests. Three fictional scenarios include place, time, date, qualified quantity, phone and condition. Training A and held-out B differ in order and hop count. Candidate selection only consumes A.

| Scenario | Chain | Version | CFS | Danger | Status |
|---|---|---|---|---|---|
| flood | A | baseline | 0.514; N=10; 95% bootstrap CI [0.471, 0.557] | 1.000; N=10; 95% bootstrap CI [0.722, 1.000] | complete |
| flood | A | optimized | 0.500; N=10; 95% bootstrap CI [0.457, 0.543] | 1.000; N=10; 95% bootstrap CI [0.722, 1.000] | complete |
| flood | B | baseline | 0.500; N=10; 95% bootstrap CI [0.443, 0.557] | 1.000; N=10; 95% bootstrap CI [0.722, 1.000] | complete |
| flood | B | optimized | 0.529; N=10; 95% bootstrap CI [0.457, 0.600] | 1.000; N=10; 95% bootstrap CI [0.722, 1.000] | complete |
| cyclone | A | baseline | 0.471; N=10; 95% bootstrap CI [0.400, 0.543] | 1.000; N=10; 95% bootstrap CI [0.722, 1.000] | complete |
| cyclone | A | optimized | not run | not run | not-run |
| cyclone | B | baseline | not run | not run | not-run |
| cyclone | B | optimized | not run | not run | not-run |
| heatwave | A | baseline | not run | not run | not-run |
| heatwave | A | optimized | not run | not run | not-run |
| heatwave | B | baseline | not run | not run | not-run |
| heatwave | B | optimized | not run | not run | not-run |

Blocked/limited: Direct requests to api.sarvam.ai were blocked by the execution environment network policy. No network bypass attempted. Remaining settings were not fabricated.

Unsupported verifier quotations are explicit unverified audit errors and receive no preservation credit. Full-run failures are retained in failure_history; resumed calls reuse cached real outputs. CFS measures this automated checker, not independently validated translation accuracy.

## Effect sizes

| Scenario | Chain | Baseline N | Optimized N | CFS difference (optimized − baseline) |
|---|---|---:|---:|---:|
| flood | A | 10 | 10 | -0.014; 95% CI [-0.071, 0.057] |
| flood | B | 10 | 10 | 0.029; 95% CI [-0.057, 0.129] |
| cyclone | A | 10 | 0 | not available |
| cyclone | B | 0 | 0 | not available |
| heatwave | A | 0 | 0 | not available |
| heatwave | B | 0 | 0 | not available |

The optimizer retained the ORIGINAL for all completed selections. Baseline-versus-selected differences are repeated-run variability, not evidence of a better rewrite.

No optimized-versus-baseline effect is claimed unless both settings have sufficient independent trials. Pilot data do not fulfill N≥10 per setting. Bootstrap resamples whole trials (2,000 replicates); N<2 has no reported CI. Small-N CIs are exploratory. Danger rate uses Wilson 95% intervals. Metrics condition on completed chain records; provider failures/incomplete chains are not scored, which can bias CFS.

Ledger: {"calls":662,"reserved_micro_inr":15992745,"actual_micro_inr":14107290,"protocol_hash":"bcf323282725498df259301b1037ebb9935f15c64f5f12c078199ebc4e0a2af3"}

Raw API requests/responses are cached under results/real with model, parameters, seeds and timestamps. No credential headers are cached. Resume reuses matching cached outputs and does not charge cached requests. Reservations conservatively use UTF-8 prompt bytes and maximum completion tokens, with actual usage refunds where reported. CLI caps are separate from the hosted D1 daily guard. Full dry-run estimates at least 1,374 calls before retries; the pilot is capped at 24 calls / INR 5. The extended run is capped at 1,400 calls / INR 25 and paced to at most 40 fresh requests/minute; account-specific lower limits still surface as errors. Human validation is absent.

The original synthetic study is preserved in docs/phase1/EVALUATION.md and public/lab/demo.json. It is not substituted for real results.
