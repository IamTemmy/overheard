# Updated implementation plan

Supersedes the arbitrary-reference and capture-only experiments in the first prototype.

1. Hosting: independent Sites project using Vinext/Workers/D1 as inspected in Blackout. Durable JSON rooms with optimistic revisions, hashed seat credentials, inference phase leases and deadline recovery. Implemented; publish the private build.
2. Mechanics: 48 situated stories with highlighted tells, random six-node coverage, two-handed heavy pickups, private warnings, public-correlated notebook and pencil guesses. Implemented; balance unmeasured.
3. AI: one isolated call per bot in parallel, then public-only Listener. Default gpt-4.1-mini. Four-second request limits, validated moves and quotes, moderation, usage/latency logging. Implemented; credentials needed for live validation.
4. M0: 32 smoke fixtures including semantic/private and composed clues. Run with live model and obtain fresh human-authored held-out examples before tuning.
5. Fun gate: Temmy plays three solo matches. Look for an understood private clue, a caught obvious hint, and a rendezvous whose communication mattered. Compare a silent strategy; no explicit silence punishment.
6. After go/no-go: full synchronized reveal, sound, mobile fit, replay awards, host controls, multiplayer and balance tests. Keep publication and validation claims separate.

Source layout: app/ thin hosted routes; src/game/ deterministic rules and seat views; src/server/ room transitions and D1 adapter; src/ai/ isolated bots, Listener and moderation; src/content/ stories; public/ browser interface; db/ and drizzle/ schema and migrations; tests/, fixtures/, scripts/, docs/.
