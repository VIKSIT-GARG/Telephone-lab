# Checker engineering evaluation

Generated 2026-10-31T07:55:24.498Z. All 76 fixtures are assistant-authored and human-unreviewed. **No human-reviewed gold-set headline accuracy exists.** Percentages below measure flags on these engineering fixtures and controls, not real translation accuracy. Ambiguity/unverified counts as a flag; this is detection recall, not exact verdict accuracy.

| Type | Mutated examples | Before recall | Before precision | After recall | After precision | TP / FP / FN / TN after |
|---|---:|---:|---:|---:|---:|---|
| time | 7 | 33.3% (n=6) | 100.0% (n=2) | 100.0% (n=6) | 100.0% (n=6) | 6/0/0/7 |
| date | 7 | 33.3% (n=6) | 100.0% (n=2) | 100.0% (n=6) | 100.0% (n=6) | 6/0/0/7 |
| numbers | 7 | 50.0% (n=6) | 100.0% (n=3) | 100.0% (n=6) | 100.0% (n=6) | 6/0/0/7 |
| phone | 7 | 0.0% (n=6) | n/a | 100.0% (n=6) | 100.0% (n=6) | 6/0/0/7 |
| qualifiers | 7 | 0.0% (n=6) | n/a | 100.0% (n=6) | 100.0% (n=6) | 6/0/0/7 |
| negation | 7 | 0.0% (n=6) | n/a | 100.0% (n=6) | 85.7% (n=7) | 6/1/0/6 |
| conditions | 7 | 0.0% (n=6) | n/a | 100.0% (n=6) | 85.7% (n=7) | 6/1/0/6 |
| certainty | 7 | 0.0% (n=6) | n/a | 100.0% (n=6) | 85.7% (n=7) | 6/1/0/6 |
| places | 7 | 0.0% (n=6) | n/a | 100.0% (n=6) | 100.0% (n=6) | 6/0/0/7 |
| ordering | 7 | 0.0% (n=6) | n/a | 100.0% (n=6) | 100.0% (n=6) | 6/0/0/7 |
| additions | 6 | 100.0% (n=6) | 100.0% (n=6) | 100.0% (n=6) | 100.0% (n=6) | 6/0/0/6 |

Recall = TP/(TP+FN). Precision = TP/(TP+FP). Correct original versions provide controls; paraphrased controls are included. No train/test separation or statistical generalization claim. Target engineering mutation recall: 95%.

Known weaknesses / false alarms: [{"type":"negation","recall":1,"false_alarms":1},{"type":"conditions","recall":1,"false_alarms":1},{"type":"certainty","recall":1,"false_alarms":1}]. Places and other fuzzy semantics still need model/human review. Hindi fraction/number vocabulary and cross-language coverage need native-speaker review.
