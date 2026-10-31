# Evaluation — recorded MOCK simulation

**These are synthetic software-test results, not real multilingual findings.** Artificial noise is deliberately lower for labeled messages. No live Sarvam calls were made.

N = 10 trials per message/version/chain. CFS is averaged at the final hop; danger is any critical mutation at any hop. All figures are computed from `dist/demo.json`.

| Scenario | A original CFS (N=10) | A rewrite CFS (N=10) | B original CFS (N=10) | B rewrite CFS (N=10) | A danger original → rewrite (N=10 each) | B danger original → rewrite (N=10 each) | Length ratio |
|---|---|---|---|---|---|---|---|
| flood | 50.0% | 92.5% | 20.0% | 87.5% | 100.0% → 30.0% | 100.0% → 50.0% | 1.17× |
| cyclone | 50.0% | 95.0% | 32.5% | 82.5% | 100.0% → 20.0% | 100.0% → 50.0% | 1.24× |
| heatwave | 40.0% | 92.5% | 32.5% | 85.0% | 100.0% → 30.0% | 100.0% → 50.0% | 0.88× |

All three rewrites perform worse on B than their fresh A validation in this synthetic sample. B was evaluated only after selecting the message using A. Candidate training scores appear in optimizer history and are not substituted for validation.

Chain A: Hindi → Tamil → Hindi. Chain B: Tamil → Bengali → Marathi → Hindi. **Mock outputs in both are English renderings**, with labels only. No result proves language-specific quality. Seeds are distinct for training candidates, validation and hold-out.

Four rewrite rounds maximum; target 0.95 training CFS; length cap 1.6× source characters. Full raw prompts, responses and metrics are in the export.

Live evaluation and human-language validation are blocked on API credentials and native-speaker review.
