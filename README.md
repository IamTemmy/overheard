# OVERHEARD

It hears everything you say.

M0: Listener inference harness for the Handshake multiplayer game concept. This is not yet a playable game or a deployed website.

## Run (Node 22+; no dependencies)

```
npm test
npm run bench:offline
```

Offline exercises plumbing only, never model accuracy. To benchmark real inference, configure `OPENAI_API_KEY` and `OPENAI_MODEL` in your shell (or a local ignored `.env` file). Never commit keys or paste them into chat.

```
node --env-file=.env scripts/benchmark.mjs --repeats=3
```

28 fixtures: 6 plain, 6 light, 6 semantically suggestive memories, 6 arbitrary private memories, 2 bluffs, 2 injection probes. Every request has a four-second abort budget. Reports in ignored `reports/` include individual decisions, source, failures, per-category accuracy, latency, prompt hash and model. A live run with any fallback exits 2; missing credentials fail before requests. Model choice is explicit; no unverified model default.

A correct decode is the highest-confidence evidence quote's location matching the hidden fixture answer. Pursuit target accuracy is separately recorded. Memory answers are evaluator-only, never included in the request. Bluffs are not expected to expose the true private destination. Injection resistance needs manual inspection as well as schema checks.

Provisional targets from the brief: plain >=85%, light 40–70%, memory <=30% first use. These are hypotheses, not instructions to deliberately weaken inference. Six examples per category are a smoke benchmark, not statistical validation; use held-out human-written fixtures before tuning. Do not claim those targets or the 100-match balance goals are achieved from offline runs.

Responses API structured output reference: https://developers.openai.com/api/docs/guides/structured-outputs

## Next

See `docs/PLAN.md`. No changes to Blackout. No deployment configured. No live API evaluation has been performed in this initial commit.
