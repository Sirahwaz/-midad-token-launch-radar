# MIDAD Token Launch Radar

A deterministic, offline-first research dashboard for the make.fun **Build the best token launch radar** bounty.

## Competition

- Official brief: https://make.fun/bounty/token-radar-01
- Starter kit: https://make.fun/c/token-radar-01/kit
- Prize pool: 1,325 USDC (ranking-based; no reward is guaranteed).
- Deadline shown on the official brief: 14 December 2026, 10:00 UTC.
- The competition requires a public repository created after opening, an OSI-approved license, a root `main.ts`, the unmodified `vendor/makefun-board.ts` from the official kit, an offline static `dashboard/`, `board.json` covering the complete watchlist (at least 100 rows), three screenshots, `dossier.json`, and authentic agent-session transcripts.

## Project status

**Repository initialized and verified.** The repository is public, the default branch is `main`, and the MIT license is present.

**Implementation is not yet complete.** No competition entry has been submitted. No wallet has been connected or signed, and no funds have been moved.

## Non-negotiable integrity constraints

1. Use the exact official kit, snapshot, rules, and vendor file. Do not recreate or modify the vendor file.
2. Derive every score and farm plan from the supplied snapshot; preserve provenance and make outputs deterministic.
3. Do not fabricate protocol data, screenshots, test results, agent transcripts, or submission status.
4. Keep the dashboard fully offline (no runtime network requests).
5. Never commit API keys, wallet secrets, seed phrases, or private keys.
6. Do not register, sign, submit, or claim a reward without the required human approval.

## Build and verification gates

- [ ] Retrieve and verify the official kit and its file hashes.
- [ ] Inspect the snapshot schema, watchlist, and exact scoring/check requirements.
- [ ] Implement `main.ts` and deterministic tests.
- [ ] Generate the complete `board.json` and `dossier.json` using the official vendor helper.
- [ ] Build the offline dashboard and validate all protocol detail/filter states.
- [ ] Capture the three genuine screenshots.
- [ ] Run the official local grading/check commands on Node.js 22.18+.
- [ ] Assemble authentic, eligible agent-session transcripts.
- [ ] Review the final commit and entry requirements before any submission.

## Execution note

The connected GitHub workflow can maintain source files, but it does not itself provide the official kit runtime, a local browser, or an eligible agent-session transcript. Those gates must be satisfied and evidenced before an entry can be called ready.
