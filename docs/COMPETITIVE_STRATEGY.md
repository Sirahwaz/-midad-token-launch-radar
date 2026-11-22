# Competitive Strategy Review — Token Radar

**Reviewed:** 2026-11-23  
**Target:** make.fun `token-radar-01` — first place ($1,000), not merely a valid entry.  
**Status:** research baseline only; this document does not claim that the entry is implemented, submitted, or likely to win.

## 1. Verified contest objective

Official brief: https://make.fun/bounty/token-radar-01

The judge compares each dashboard against another entry. The most important criterion is a working radar: every watchlist protocol is covered, pre-token protocols are ranked by an explicit implied value, and the screenshots agree with the executable code. The judge also evaluates the farm plans and the quality, clarity, and usefulness of the dashboard.

Hard gates include:

- Node.js 22.18+, standard library only, root `main.ts`.
- The unchanged official `vendor/makefun-board.ts`.
- At least 100 board rows, complete watchlist coverage, and a farm plan for every row.
- A static offline dashboard with a board, a protocol detail view, and filtering.
- Three genuine screenshots: board, detail, and filtered view.
- A deterministic build: two executions must write byte-identical outputs.
- An authentic, eligible agent-session transcript bundle. Entries without acceptable transcripts are rejected before judging.
- The final entry is the latest receipt before the deadline. The official page lists 14 December 2026, 10:00 UTC.

Prize distribution is $1,000 for first, $50 for places 2–5, and $25 for places 6–10 (paid in USDC on Solana). No reward is guaranteed.

## 2. Public competitor patterns observed

These are observations from public repository READMEs and source files, not independent validation of their numerical claims.

| Public entry | Publicly described approach | Strategic implication |
|---|---|---|
| https://github.com/0xspotonchain/token-launch-radar | TVL anchor × fixed 0.30 × growth × maturity; 178 ranked rows; six-step farm plans | A simple heuristic is a useful baseline, but weak differentiation. |
| https://github.com/Jasonrichh/token-launch-radar | Category median market-cap/TVL, growth tanh, maturity; 226 rows; eight-step plans | Category calibration and broader coverage are visible differentiators. |
| https://github.com/Senz14/token-radar | Category comparables shrunk toward global median; peer-growth and evidence signals; eight-step farm plan; live-token view | Explainability, evidence quality, and a useful dashboard matter alongside the ranking. |
| https://github.com/Antrezur/Token-Radar | Publicly describes a size curve, category adjustments, estimated launch odds by category/age, leave-one-out and time-split tests, bootstrap intervals, and farm economics net of cost | The strongest publicly described modeling direction is expected value = launch value × launch probability, with uncertainty and net farm economics. |

## 3. Recommended MIDAD differentiation

Do not copy competitor code or rely on a single opaque score. Build an independently implemented and reproducible model with the following layers:

1. **Eligibility and census**
   - Preserve all 40 watchlist entries.
   - Apply the exact official exclusion rules to every candidate.
   - Produce an auditable census: ranked, live-token, and excluded counts with a reason for every exclusion.
   - Keep live-token protocols in a separate view; never mix their market caps into the pre-token ranking.

2. **Launch-value distribution**
   - Fit a robust log-log market-cap/TVL relationship on eligible tokenized comparables.
   - Shrink category effects toward the global fit to control small-sample noise.
   - Use leave-one-out predictions for every tokenized protocol in backtests.
   - Publish point estimates and calibrated prediction intervals, not just a single unsupported number.

3. **Launch probability**
   - Estimate issuance probability from category and protocol-age cohorts using explicit Bayesian smoothing.
   - Validate with held-out folds and time-ordered/walk-forward splits.
   - Report calibration, log loss, Brier score, and base-rate comparisons.
   - Never treat correlation as proof that a protocol will issue a token.

4. **Expected value and farm economics**
   - Rank on expected value, clearly separating launch value from issuance probability.
   - Compute a conservative lower-bound farm outcome and subtract explicit transaction costs.
   - Show capital, gas, time, hold period, expected net value, and a FARM / THIN / SKIP verdict.
   - Do not recommend a plan whose expected net outcome is negative or whose assumptions are unsupported by the snapshot.

5. **Dashboard quality**
   - Offline-first; no runtime network calls.
   - Search, category/chain filters, deterministic sorting, and a useful protocol detail view.
   - Show why a protocol ranks where it does: inputs, comparables, probability, uncertainty, evidence gaps, and farm economics.
   - Include a model sandbox for sensitivity analysis, but label user-adjusted outputs as scenarios, not official scores.
   - Capture genuine screenshots from the final dashboard only.

6. **Verification**
   - Tests first: exclusions, watchlist coverage, no leakage, probability calibration, interval coverage, farm-cost arithmetic, deterministic ordering, and output byte identity.
   - Run the official checker against the exact official kit.
   - Rebuild the dossier from final output and verify that screenshots and dashboard assets are exactly those the judge sees.
   - Preserve raw test output and provenance; never claim a check passed unless its output is retained.

## 4. Current MIDAD repository state and blockers

Repository: https://github.com/Sirahwaz/-midad-token-launch-radar  
Working branch: `bootstrap/official-kit`

Before this review's documentation commit, the GitHub branch contained only `.github/workflows/prepare-official-kit.yml`, `LICENSE`, and `README.md`. This review added `docs/COMPETITIVE_STRATEGY.md`; it did not add the missing implementation source.

The pre-review branch head was `c762aca4689a707d0cd795744218f737a8fd4689`. The verified head after this review is `7498e52b11902955d545ce9028e2ea34608f91c0`. The previously reported four implementation commits were made in a SuperBot local workspace and were not pushed. The saved session transcript reports test and model metrics, but the source tree is not present on the remote branch and those metrics have not been independently rerun here.

The prior GitHub Actions kit artifact had a seven-day retention period and is no longer listed for its 15 November run. The official kit, snapshot, vendor source, and the four local commits therefore remain recovery dependencies. Do not fabricate or reconstruct them while claiming they are the original kit or original implementation.

## 5. Execution order

1. Recover the exact prior implementation and its recorded session bundle, if the SuperBot workspace/export remains available.
2. Recover the exact official kit and sealed snapshot from an authorized retained artifact or existing source; verify all manifest hashes before use.
3. Reconcile the recovered source with the current branch without overwriting existing history.
4. Re-run tests and official checks from a clean state; fix the transcript gate before any submission.
5. Upgrade the model and dashboard against the competitive criteria above, using original implementation and evidence.
6. Capture genuine screenshots, rebuild the dossier twice, and compare output bytes.
7. Review the exact commit, transcript bundle, wallet/payout conditions, and submission receipt. Obtain explicit approval before signing or submitting.

**No entry has been submitted, no wallet has been connected or signed, and no prize has been earned or claimed.**
