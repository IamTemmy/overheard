# OVERHEARD

It hears everything you say.

A cooperative radio thriller for 2–5 survivors. Find three tower parts and use private shared stories to coordinate while the Listener intercepts every transmission. Antenna and battery require two living survivors to lift; one can carry afterward. FUSE is a solo pickup.

## Hosted implementation

Vinext + Cloudflare Workers + D1, following the working patterns inspected in IamTemmy/blackout. D1 stores room JSON with revision-checked updates. Seat tokens are hashed. Polling advances server-clock deadlines; no in-memory singleton or persistent process timer is required. Inference reserves a per-phase lease before calling models; expired jobs fall back and late responses cannot overwrite a new phase.

The hosting identity is in `.openai/hosting.json`. Never copy Blackout's project ID or database into this project. The private deployment is a playtest, not the final competition submission.

## Develop

Node 24 is recommended (storage tests use built-in SQLite).

```
npm run install:ci
npm test
npm run typecheck
npm run build
npm run dev
```

The Sites development profile must provide local D1 with migrations applied; follow the starter's deployment helpers. An additional lightweight in-memory development server remains available as `npm run start:local` at http://127.0.0.1:3000. It exercises scripted play only, not the persistent hosted adapter or LLM teammate workflow.

## AI configuration

`OPENAI_API_KEY` is a server-only secret. Configure through the approved OpenAI Developers/Sites workflow. Never put credentials in source, browser variables, the hosting manifest, commits or chat. A local ignored `.env` may be used for M0. `OPENAI_MODEL` defaults to `gpt-4.1-mini` in hosted play, matching Blackout's source default; Blackout's actual runtime override was not inspected.

Each bot gets one isolated call per turn, with only its own redacted seat view plus shared memories. Calls run in parallel. Scripted opening requests give humans a coordination prompt; the model then interprets human replies and picks a legal move. The Listener gets only public data, never memories, player positions, part positions or bot intents. Bot and Listener requests time out after 4 seconds. Token usage, latency and source/fallback are logged; monetary cost is not calculated. Generated radio text and taunts are moderated when credentials exist. User transmissions fail closed if the configured moderation service is unavailable.

No key: the UI explicitly labels scripted fallback. This mode tests rules and hosting but does not validate AI comprehension. The current private deployment has no configured key. Do not claim live AI accuracy or gameplay quality from offline results.

## Rules adopted after review

- 48 situated stories, four per location. Deal six random locations; objective/tower coverage is not guaranteed. Highlighted tell words warn players about obvious clues. No random-handle codebook.
- Heavy pickups require two surviving players at the node after capture resolution. A Static player cannot help. Dropped heavy parts need two hands again. Capture precedes pickup and delivery.
- Notebook pencil entries are unconfirmed guesses. A phrase spoken within the last two turns can gain public corroboration from CLANG, CAPTURE or DELIVERED at the guessed node in the same or following turn. These are **correlations, not proven private intentions**. Both players and the Listener see that uncertainty; bluff-induced false associations remain possible.
- Private danger cues/Static vision are not automatically broadcast. Teammates must communicate what they know.
- Late NORMAL turns allow two-step Listener movement at >=0.8 confidence. Traversed destinations and the first simultaneous edge swap can capture.

## M0 benchmark

```
npm run bench:offline
node --env-file=.env scripts/benchmark.mjs --repeats=3
```

32 author-written smoke fixtures: plain, light, situated semantic/private hints, composed map clues, bluffs and injection probes. The evaluator's answer key is never included in model input. Accuracy uses the highest-confidence grounded quote; pursuit-target correctness is separate. Reports include model, prompt hash, latency, token usage where available, source and per-category accuracy. A live run with any fallback exits 2. Missing credentials fail before API requests. Reports are ignored in Git.

These are not human-written held-out examples. Collect those from Temmy/playtesters before prompt tuning. Plain >=85%, light 40–70%, private <=30% and later match-balance targets remain hypotheses, not achieved results.

## Verification and remaining work

42 automated tests and TypeScript checks pass. The production build passes. Tests cover fog, spawn constraints, heavy pickups, public evidence, isolation, concurrent DB leases, stale AI output, seat access and turn resolution. Browser visual QA is unavailable in this environment; layout and real multiplayer playtests remain required.

See `docs/STATUS.md`. Next: secure key setup, live M0, three solo matches, then audio/listening choreography, improved mobile drawers, host kick, replay awards, difficulty and balance. Blackout was read only and remains unchanged.
