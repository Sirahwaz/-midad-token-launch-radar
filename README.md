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


## Verified engineering baseline (2026-11-15)

The official development kit was downloaded from make.fun in GitHub Actions and all **20 manifest-listed files** passed their individual SHA-256 and size checks. Runtime used Node.js **v22.23.4**.

The unmodified official starter was executed against the sealed snapshot:

- Input: 758 protocols; 40 watchlist slugs.
- Output: 200 ranked rows (40 watchlist + 160 early candidates).
- Dashboard: 3 static files; dossier generated successfully.
- Three starter screenshot files were copied into the baseline output.
- The baseline smoke-test workflow completed successfully: [run 43716546759](https://github.com/Sirahwaz/-midad-token-launch-radar/actions/runs/43716546759).

This is a **starter smoke test**, not the official make.fun pre-submit check and not a competition submission.

## Known baseline weaknesses to repair

An independent audit of the sealed snapshot found 198 candidates under the explicit watchlist exclusion rules (40 watchlist + 158 eligible below-floor candidates). The starter instead selects 160 below-floor protocols by TVL alone. Compared with the rule-aligned candidate set, that baseline selection contains 39 false-positive slugs and misses 37 eligible slugs.

Next model work must therefore:

1. Preserve all 40 watchlist slugs.
2. Apply the same exclusion logic to early candidates (bridge/wrapped/staked products, CEX, version-marked names and exchange-prefixed names).
3. Replace the starter's TVL-only implied-value heuristic with a documented, snapshot-only comparable-token model.
4. Backtest the model on tokenized protocols without leaking the target into its own comparables; report calibration and uncertainty.
5. Replace starter sample screenshots with genuine captures of the final dashboard.
6. Run the official pre-submit checks and assemble authentic agent-session transcripts.

No wallet has been connected or signed, no entry has been submitted, and no funds have been moved.
