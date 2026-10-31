# 90-second demo

0–12 s: “Warnings cross languages and neighbours. A small change to a place or deadline can change what people do. Telephone Lab makes that drift inspectable.”

12–24 s: Select Flood evacuation. “This is a fictional drill. Here is the original message and its four critical facts. This demo is a recorded synthetic simulation, not a live or real-human experiment.”

24–42 s: Click Replay. Expand the first red hop. “The current speaker receives only the last message. We normalize and independently extract facts after every hop. Here a deadline, action or location has changed. The table shows exactly what was expected and observed.”

42–60 s: Switch to Rewritten and inspect the same trial number. “The optimizer tries bounded, explicit rewrites on chain A. These are independent stochastic trials, so corresponding trial numbers are not paired samples. This English simulator intentionally rewards labeled structure; it tests our system, not a multilingual hypothesis.”

60–78 s: Show summary and switch to chain B. “Every percentage has a trial count. Scores are calculated from saved hop records. The hold-out was never used to select the rewrite. It performs worse than chain A in this bundled sample, and we report that.”

78–90 s: Open Methodology. “Our next step is real Sarvam calls and a study with native speakers. We make no dialect or official-alert claim. The contribution is an auditable workflow to test message survival.”

## Rehearsal checklist

Load all three scenarios, inspect a changed fact, switch versions and hold-out, open optimizer history, and export JSON. These flows were exercised during browser QA; no claim is made of two timed human rehearsals.

For a live demo, configure the server key beforehand and verify a one-trial run. Use recorded mode explicitly if a provider is unavailable; never relabel it live. The API itself never silently falls back.
