# OVERHEARD

It hears everything you say.

Local playable prototype plus M0 Listener inference harness for the Handshake multiplayer game concept. No hosted deployment yet.

## Run (Node 22+; no dependencies)

```
npm start
# Open http://127.0.0.1:3000

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

## Local playtest

Create a room, choose the total crew size (default: you + 3 bots), and start. Use a second browser or browser profile to join the room before starting. Rooms support 2–5 total survivors; empty seats become bots. Send at most two 80-character radio messages, select an adjacent move, and lock. The server resolves after everyone locks or 30 seconds elapse, followed by a 6-second listening phase. A refresh rejoins your seat; an ordinary return visit starts at home. Captured players become Static, see the Listener, and get one transmission per turn. The Tape reveals movements only after the match ends.

Teammates are currently scripted, not LLM-driven. They use only their own seat view, path toward their known parts/tower, and understand `help [exact memory phrase]` when otherwise free. The default offline Listener follows public noise/plain names, so **this build cannot establish whether the AI code-breaking mechanic is fun**. Enable the live Listener explicitly with `LIVE_LISTENER=1`, an API key, and a model; for an ignored `.env` file run `node --env-file=.env src/server/server.mjs`.

Private reference-to-location associations are freshly shuffled per match, including references for all three initial part locations and the tower. Extra bot seats duplicate the other bots' intel rather than automatically receiving the first human's unique clue. There are 12 temporary reference stories, not the final 48-memory content set.

This is a single-process local development server bound to 127.0.0.1. Rooms live in memory, expire after two inactive hours, and disappear on restart. It is not suitable for serverless or multi-instance deployment. Online message moderation, persistent room storage, rate limiting, host kick, isolated LLM teammate calls, sound, complete listening choreography, and final responsive-layout verification remain before a public release. Do not expose this prototype as the competition submission.

## Verification and next steps

28 automated tests cover the Listener boundary, spawn invariants, private seat views, radio limits, capture/drop/pickup precedence, late-game two-step traversal, turn-12 victory, Static restrictions, HTTP seat authentication, late joins, stale actions, and duplicate resolution. HTTP tests use two human seats. Browser visual QA has not run: the execution environment has Playwright but no installed browser executable.

See `docs/PLAN.md` and `docs/STATUS.md`. Blackout is unchanged. Live AI accuracy and actual playtest fun remain unmeasured.
