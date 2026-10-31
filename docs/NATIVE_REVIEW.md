# Native-speaker review workflow

No native-speaker reviews were obtained during Phase 2. Human agreement and calibration are unavailable, not zero accuracy. The app never simulates reviewer identities or verdicts.

1. Download a pack from a studio result, or use a fictional real-call example under `public/review-packs/`.
2. Open or download `/reviewer.html` and load the JSON pack. It provides a simple correct/wrong/unclear form and runs locally in the browser without uploading the pack. Ask a fluent human to read the source and native translation independently. They should not infer correctness from the back-translation or automated verdicts.
3. For each critical fact set `verdict` to `correct`, `wrong` or `unclear`; add a short comment. Check polarity, condition, certainty, numbers, units, per-person qualifiers and named places.
4. Enter an anonymous ID (3–50 letters/digits/underscore/hyphen), ISO review date, and explicitly confirm `native_speaker` and `consent`.
5. Import the completed JSON on `/evidence`, or validate it locally with `node scripts/phase2/review-pack.mjs --import completed.json anonymous-judgments.json`.

Source and translation hashes bind the reviewed text. Hashes do not prove human authorship or proficiency. Reviewer fluency/identity are self-declared, which is shown in evidence. Users can falsify self-reported reviews; no claim of independently certified validation is made.

Hosted storage retains anonymous judgments, optional comments, hashes, language and dates for 30 days by default (`REVIEW_RETENTION_DAYS`, bounded 1–90). It does not retain the source or translation text. Avoid putting personal or identifying details in comments. Delete imported records using the Evidence page. Quota records use a separate short expiry and are not deleted with reviews, so deleting reviews cannot reset spending limits.

The Evidence page computes human/automated, human/judge and human/human agreement counts on available judgments. `unclear` remains a separate human/judge verdict; binary comparison to the automated checker treats it as not established correct. No agreement percentage is reported with a zero denominator. A human-reviewed case is not evidence that every message in a language is accurate.
