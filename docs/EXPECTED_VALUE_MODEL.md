# Expected-value model core (prototype)

**Status:** implemented and unit-tested on synthetic fixtures; not yet integrated into the competition entrypoint and not yet calibrated on the official sealed snapshot.

## Purpose

The ranking target is expected launch value, not raw TVL and not token market cap alone:

`expected_value = estimated_launch_market_cap × probability_of_token_issuance`

The module is deliberately independent of the missing official-kit files. It accepts normalized protocol records and can be integrated once the exact snapshot, official vendor helper, and entrypoint are recovered.

## Value model

1. Fit `ln(mcap_usd) = intercept + slope × ln(tvl_usd)` on positive-market-cap comparables.
2. Use deterministic Huber iteratively reweighted least squares to reduce the leverage of extreme comparables.
3. Compute category residual medians and shrink them toward the pooled fit with `n / (n + categoryShrinkage)`; cap the effect.
4. Apply bounded, explicit growth and maturity multipliers. These are priors, not coefficients claimed to have been learned from the sealed snapshot.
5. Return a point estimate and a log-scale 80% interval based on robust residual dispersion.

## Issuance-odds model

- A protocol is treated as tokenized when any of `mcap_usd`, `gecko_id`, or `symbol` is present (including a zero market-cap record).
- The global rate uses a Beta(1,1) prior.
- Category rates are smoothed toward the global rate.
- Category-by-age cells are smoothed toward their category rate.
- Age buckets are `0–180d`, `181–365d`, `366–730d`, `731d+`, and `unknown`.
- `excludeSlug` supports leave-one-out evaluation; `crossValidateLaunchOdds` scores deterministic held-out folds against a base-rate baseline.

## Farm economics

`scoreExpectedValue` keeps the market-cap estimate, issuance probability, farmer share, and gas cost separate. Its conservative gross estimate uses the lower value bound multiplied by the lower probability bound. Net farm value subtracts explicit gas cost. Verdict thresholds are configurable; the default FARM threshold is $20 net.

## Public interface

- `fitValueModel(protocols, { asOf })`
- `predictLaunchValue(protocol, model, { asOf })`
- `fitLaunchOdds(protocols, { asOf, excludeSlug? })`
- `predictLaunchOdds(protocol, model, { asOf })`
- `backtestValueModel(protocols, { asOf })`
- `crossValidateLaunchOdds(protocols, { asOf, folds })`
- `scoreExpectedValue(valuePrediction, oddsPrediction, economics)`

The module uses only Node.js built-ins and has no runtime network dependency.

## Verification and limitations

The ten tests in `tests/expected-value.test.mjs` cover robust-fit resistance to an extreme outlier, category shrinkage, positive and ordered value intervals, bounded growth/maturity adjustments, Bayesian cohort smoothing, leave-one-out exclusion, expected-value/farm-cost arithmetic, deterministic input ordering, value-model leave-one-out backtesting, and held-out odds evaluation.

**Not yet established:**

- No official-snapshot metrics are claimed.
- The 80% value interval is a provisional normal approximation and must be calibrated against leave-one-out results on the official snapshot.
- Growth and maturity multipliers must be ablated and compared with held-out performance before final ranking use.
- Odds calibration must be checked with Brier score, log loss, and reliability bins on the official snapshot.
- The model is not yet wired into `main.ts`, the dashboard, or the official dossier.
- This module is not a substitute for the official kit, official exclusion rules, genuine screenshots, or eligible agent-session transcripts.

The next integration gate is to recover the exact official snapshot and vendor kit, then run the full selection, model, dashboard, determinism, and official transcript checks before any submission.
