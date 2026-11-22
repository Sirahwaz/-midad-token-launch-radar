# MIDAD Token Launch Radar

A deterministic, offline-first research dashboard for the make.fun **Build the best token launch radar** bounty.

## Competition

- Official brief: https://make.fun/bounty/token-radar-01
- Starter kit: https://make.fun/c/token-radar-01/kit
- Prize pool: 1,325 USDC in total; **$1,000 is first place only**. Other paid places receive smaller rewards.
- Deadline: 14 December 2026, 10:00 UTC.
- Payout is in USDC on Solana. Ranking and payout are not guaranteed.

The entry requires a public repository created after the competition opened, an OSI-approved license, root `main.ts`, the unmodified official `vendor/makefun-board.ts`, an offline static `dashboard/`, a complete watchlist board with at least 100 rows and a farm plan per row, three genuine screenshots, `dossier.json`, and eligible native agent-session transcripts.

## Project status — 2026-11-23

**Status: IN PROGRESS**

The repository is not submission-ready. No entry has been submitted, no wallet has been signed, and no reward has been earned or claimed.

### Verified work in the current branch

- Competitive review and execution gates: `docs/COMPETITIVE_STRATEGY.md`.
- An independent expected-value model prototype: `lib/expected-value.mjs`.
- Thirteen synthetic unit tests: `tests/expected-value.test.mjs`.
- Node.js 22.23.4 CI passed: [run 45077949747](https://github.com/Sirahwaz/-midad-token-launch-radar/actions/runs/45077949747).
- Model interface and limitations: `docs/EXPECTED_VALUE_MODEL.md`.

**Important:** the model prototype is not yet integrated into the competition entrypoint and has not been calibrated against the official sealed snapshot. Passing synthetic tests does not establish competition readiness or predictive performance.

### Missing submission components

The current remote branch contains ChatGPT-assisted research/prototype files, but it does not contain an eligible, transcript-authored competition implementation or the required submission assets. The prototype in `lib/expected-value.mjs` and its tests were written through the GitHub connector, not in a make.fun-eligible recorded SuperBot session. Preserve them as research only; do not count or copy their lines into the final deliverable unless a valid recorded agent session independently authors/revises the final source in compliance with the current transcript gate.

The current branch does not contain:

- `main.ts` and the original `lib/` implementation from the previous SuperBot workspace.
- The byte-identical official `vendor/makefun-board.ts`, official kit, and sealed snapshot.
- Final `dashboard/`, three genuine screenshots, generated `board.json`, and `dossier.json`.
- A valid, eligible native agent-session transcript bundle and complete run record.

**Correction from the project owner (2026-11-23): SuperBot stopped at its spend limit before it created any project source files or implementation commits. No SuperBot implementation workspace, four local commits, or native JSONL build transcript exists. Earlier notes claiming those artifacts existed are withdrawn and must not be used as evidence.** The seven-day GitHub Actions artifact retention for the 15 November kit run has elapsed. The official kit must be retrieved and hash-verified again.

### Candidate-count discrepancy — unresolved

Two earlier reports disagree:

- An older audit recorded 198 candidates (40 watchlist + 158 early) and 37 misses from the starter's TVL-only cut.
- The later SuperBot session reported 178 candidates (40 + 138) and 17 misses, noting that `parentProtocol` was not among the snapshot's ten exposed fields.

Neither count is being treated as independently re-verified in this ChatGPT session. Reconcile the exact official `RULES.txt`, snapshot, and vendor helper before freezing the board.

## Non-negotiable integrity constraints

1. Use the exact official kit, snapshot, rules, and vendor file. Do not modify the vendor file.
2. Derive every score and farm plan from the supplied snapshot; preserve provenance and deterministic outputs.
3. Do not fabricate protocol data, screenshots, test results, agent transcripts, submission status, or expected rewards.
4. Keep the dashboard fully offline (no runtime network requests).
5. Never commit API keys, wallet secrets, seed phrases, or private keys.
6. Never sign, submit, or claim a reward without the required human approval.
7. Do not present ChatGPT-authored prototype code as if an eligible SuperBot/Codex agent session authored it. The competition transcript gate checks authorship and may reject an entry without eligible recorded sessions.

## Required execution sequence

1. Recover the exact previous SuperBot workspace/source and its native session log, or obtain explicit approval to retrieve the exact official kit again and verify it against the recorded hashes.
2. Reconcile the candidate counts against the official rules and sealed snapshot.
3. Reconcile the recovered source with `bootstrap/official-kit` without overwriting history.
4. Have the accepted recorded agent session author/revise the final entrypoint and dashboard; preserve the complete run record and usage-bearing transcripts.
5. Integrate the model only after official-snapshot backtests, probability calibration, farm-cost validation, and ablation tests justify it.
6. Generate the board and dossier twice; verify byte identity, full watchlist coverage, offline rendering, and genuine screenshots.
7. Run the official checker, inspect every transcript-gate result, then review the exact commit and payout path.
8. Obtain explicit approval before signing or submitting.

## Verified engineering baseline (2026-11-15)

The original GitHub Actions workflow reported that all 20 manifest-listed official-kit files passed individual SHA-256 and size checks, using Node.js v22.23.4. The unmodified starter smoke test reported:

- Input: 758 protocols and 40 watchlist slugs.
- Output: 200 rows (40 watchlist + 160 early candidates).
- Three static dashboard files and a generated dossier.
- Workflow: [run 43716546759](https://github.com/Sirahwaz/-midad-token-launch-radar/actions/runs/43716546759).

This was a starter smoke test, not the official pre-submit check and not a competition submission. Its artifact is no longer retained.

## Current next blocker

Recover the original SuperBot workspace/session or authorize retrieval of the exact official kit again. Until the source, official snapshot, vendor helper, and eligible transcripts are available, do not claim that the entry is ready or submit it.
