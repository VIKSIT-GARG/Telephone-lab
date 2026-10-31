# Live Sarvam smoke test — 31 October 2026

A real end-to-end pipeline test used this fictional input:

> Fictional drill: Meet at the school by 6 PM on 17 August 2030. Bring 2 bottles of water. Do not return home.

Sarvam extracted seven grounded facts. The pipeline generated a Hindi translation, back-translated it, checked all facts, and attempted one repair. The selected result preserved 7/7 extracted facts according to its automated checks, with no added claims flagged. N=1 translation workflow; this is not a benchmark or native-speaker validation.

Selected Hindi output:

> काल्पनिक ड्रिल: 17 अगस्त 2030 को शाम 6 बजे तक स्कूल पर मिलें। पानी की 2 बोतलें लाएं। घर वापस न लौटें।

English back-translation:

> Hypothetical drill: Meet at the school by 6 PM on August 17, 2030. Bring 2 water bottles. Do not return home.

The API key was supplied through hidden input and remained in process memory. It was not written to a local file, committed, included in output or placed in browser code. Production uses a hosted runtime secret. An initial direct V1 connectivity request also returned HTTP 200.

## Tamil and hosted checks

The initial hosted fact-extraction endpoint returned HTTP 200 and five facts for a fictional workshop message. A Tamil back-translation used an inconsistent JSON shape; the API surfaced this as HTTP 502 with no fallback. Response schemas were tightened using Sarvam's documented strict JSON Schema output mode and regression-tested.

A subsequent real Tamil end-to-end test completed, extracting six facts and returning a native-script translation plus back-translation after one repair. All six fact checks reported preserved, but an additional review flag remained; this was not hidden or relabeled as a clean result. N=1 workflow. Same-model judging and translation remain imperfect.
