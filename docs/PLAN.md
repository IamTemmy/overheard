# Implementation plan and decisions

## M0

Build a public-input-only Listener, strict output/evidence validation, four-second timeout and deterministic public-evidence fallback. Benchmark 28 transcripts with separate semantic/private-memory categories. Live measurement is blocked until an API key and explicit model are configured. The current taunt guard checks length/control characters only; content moderation/filtering is still required before user-facing deployment. Do not treat schema validation as complete prompt-injection protection.

## M1: playable vertical slice

Use TypeScript UI with a server-owned pure rules engine. Select hosting/persistence before choosing timer implementation; do not rely on process-local rooms or client clocks in a serverless deployment. Store room state, seat-token hashes, deadlines and a revision; resolve each turn once with an atomic state transition. Redact per-seat views. Resolve late requests deterministically. Build lobby, room codes, refresh rejoin, bots, fog, movement, edge-swap capture, drops/pickups, delivery and victory. Cover these invariants with deterministic tests.

Planned directories: `app/` interface and server routes; `src/game/` state, map, turn resolution, seat views; `src/ai/` Listener, bots, hints and moderation; `src/content/` characters and 48 memories; `src/server/` room storage/auth/timing; `fixtures/`, `scripts/`, `tests/`, `docs/`.

## Changes proposed to the handoff

1. Coffee/diner and proposal/Ferris Wheel references leak meaning. Add arbitrary specific references with enough coverage to support real routes. Test semantic vs private clues separately; never instruct the Listener to miss easy clues.
2. Secret-position verification of notebook entries is an information oracle. Keep speculative deductions separate from facts confirmed by public captures/noise. Burn exact phrases on confirmed public evidence; topic associations remain inference. The end-game Tape can reveal private truth.
3. A single batched bot request exposes every bot's private view to the same model. Use isolated per-bot inference in parallel, with cost/latency tracking; deterministic coordination fallback must respect each bot's knowledge too.
4. Silence/direct movement may dominate. Measure whether private part knowledge makes radio communication useful. Do not add punishments for silence before the first playtest.
5. Fixed character quirks are effectively public over repeated matches. Do not depend on their secrecy. Fresh private reference mappings should provide the information advantage.
6. At 12 turns and 30+8 seconds, nominal duration is 7.6 minutes; early locks or early loss shorten that. Treat 6–9 minutes as pacing intent, not a guaranteed property.
7. Define two-step capture semantics before HARD mode: check intermediate path intersections, not just final nodes, or explicitly explain traversal immunity. Resolve last-part delivery vs last-survivor capture with a documented precedence.
8. Validate spawn constraints with retry limits and deterministic fallback. Avoid initial part placement under survivors unless its pickup timing is explicit.

## M2/M3 and validation

After solo play works, add code burning, private proximity cues, synchronized listening choreography, Web Audio, drawers, hint drafts, and Static participation. Then the Tape, awards, mobile and real multiplayer playtests. Proximity cues and animation must not reveal hidden creature positions beyond the rule's allowed observation. Store full truth for post-game replay on the server only.

Temmy's three-match fun check is the gate. The 100-match NORMAL simulation and live fallback rate are later milestones, not M0 results. Record deterministic and live-AI simulation results separately. Submission dates and rubric are supplied by the handoff, not independently verified here. Pair memories remain stretch scope.
