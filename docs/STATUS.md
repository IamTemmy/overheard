# OVERHEARD — review follow-through, 2026-10-20

## Current implementation

- Ported to the same hosting family as Blackout: Vinext, Workers, D1 room JSON, revision-checked writes and polling-driven server deadlines. Independent Site/database. No Blackout mutation.
- Verified Blackout source default: `gpt-4.1-mini` (`lib/game/banter.ts`), optionally overridden by `OPENAI_BANTER_MODEL` (`app/api/banter/route.ts`). Overheard uses `OPENAI_MODEL` with the same default. Runtime override/secrets were not inspected.
- 48 situated memories, 4 per location, 6 random location cards. Tells highlighted; no guaranteed objective coverage or arbitrary handles.
- Two-person lifts for ANTENNA/BATTERY; solo FUSE; dropped heavy parts also need two living survivors. Post-lift carrying is solo.
- Private danger cues retained. Scripted opening requests and isolated parallel LLM teammate adapters. Each adapter sees only its seat view. Model calls are implemented but untested live without credentials.
- Pencil suspicions plus public-event-correlated notebook entries. Corroboration is explicitly uncertain, not a factual decoding oracle. Source event retained.
- M0 now 32 smoke fixtures with situated references and composition. Not human-authored held-out fixtures. No live accuracy report yet.
- Moderation adapter for configured live mode; keyless mode restricted by private Site access and clearly marked fallback. No private-key content is in the source.

## Validation

42 automated tests passed, including heavy pickup, no ghost assistance, no future/old-event certification, bot input isolation, SQLite-backed D1 adapter tests, concurrent inference lease and stale-result rejection. Type checking and production build passed. Browser QA skipped because the required managed browser skill is unavailable. Hosted real-browser QA and full live gameplay remain unmet gates.

## Remaining before competition submission

Secure API credential setup; live benchmark and held-out human examples; three solo fun tests; real multiplayer tests; sound and full listening choreography; polished mobile drawers; host kick; replay awards; difficulty selection; rate/load validation and live balance runs. Dollar-cost estimates are not implemented; logs contain token usage and latency.

## Review decisions

Claude's criticisms of arbitrary handles and silence were accepted. Heavy lifts introduce a reason to rendezvous, but do not guarantee communication will be necessary or fun in every match; this still needs playtesting. Public correlations are retained as fallible beliefs because a decoy plus unrelated public event is not proof. This allows bluffing without labeling false inference as truth.

The Oct 21 goal is a hosted playtest with live credentials if supplied, not a claim that all acceptance criteria will be proven by then.
