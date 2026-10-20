# OVERHEARD handoff — 2026-10-20

## Completed

- M0 harness and 28 canned transcripts; 15 original tests pass. No live inference measurements yet.
- Local playable vertical slice: HTTP room creation/join, 2–5 seats, host start, automatic bot fill, private move selection, server deadlines, six-second listening phase, room token authentication, refresh rejoin.
- Game engine: graph movement, randomized safe spawns and part locations, per-seat fog, private intel, shared shuffled memories, part pickup/noise/delivery, capture and edge swaps, Static participation, 12-turn outcome, post-match Tape.
- Scripted teammate fallback consumes only its own view. Optional live Listener reuses M0 adapter. Full LLM teammate inference is not implemented.
- Capture-confirmed notebook entries only, based on an attributed current-turn quote. Secret positions never certify guesses. Other proposals remain unconfirmed and are not persisted.
- 28 total automated tests passed. Browser QA blocked by missing browser executable; do not claim 1280×720 or 390×844 acceptance yet.

## Run

`npm start`, then visit http://127.0.0.1:3000. No packages need installation on Node 22+.

## Deliberate provisional rules

- Capture precedes part pickup and delivery. A captured carrier cannot win by arriving at the tower that turn.
- On turns 10–12, a >=0.8-confidence Listener can move two steps. Both visited destination nodes can capture; reverse edge crossing is checked on the simultaneous first step.
- Current notebook confirmation uses public capture evidence for the quoted speaker. Noise alone does not identify a speaker, so it cannot certify an association.
- Match-specific arbitrary phrase/location assignments replace persistent semantic-only secrets in this prototype.
- Extra bot seats do not duplicate the first human's unique part clue, keeping a reason to communicate.

## Next gates

1. Configure credentials securely and run live M0. Separate semantically obvious clues from arbitrary private references. Use held-out examples; don't tune the Listener to lose.
2. Add isolated LLM teammate calls with input redaction, structured validation, timeout and fallback. Measure whether teammates understand free-form human hints.
3. Install a test browser / run visual and interaction QA locally, then Temmy's three solo matches.
4. Choose deployment and persistent transactional room storage. Add moderation, abuse limits and host kick before external playtesting.
5. Complete 48 memories/character voices, listening reveal choreography, audio, mobile drawers, difficulty, replay awards and balance simulation.

M1 is partial: the runnable offline slice exists, but full AI teamwork and hosted deployment remain. No claim that the concept or competition targets have been validated.
