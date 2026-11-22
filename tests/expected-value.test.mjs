import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fitValueModel,
  predictLaunchValue,
  fitLaunchOdds,
  predictLaunchOdds,
  scoreExpectedValue,
} from '../lib/expected-value.mjs';

const asOf = '2026-11-14';

function tokenizedRows() {
  const rows = [];
  for (let i = 0; i < 30; i += 1) {
    const tvl = 1_000_000 * (1 + i) ** 1.3;
    const mcap = Math.exp(1.2) * tvl ** 0.72;
    rows.push({
      slug: `token-${String(i).padStart(2, '0')}`,
      category: i % 2 ? 'DEX' : 'Lending',
      tvl_usd: tvl,
      mcap_usd: mcap,
      gecko_id: `token-${i}`,
      symbol: `T${i}`,
      listed_at: `202${i % 5}-01-01`,
      change_7d: (i % 7) * 3,
    });
  }
  return rows;
}

function withPreToken(slug, category, tvl, listedAt = '2024-01-01', change7d = 12) {
  return {
    slug, category, tvl_usd: tvl, mcap_usd: null, gecko_id: null,
    symbol: null, listed_at: listedAt, change_7d: change7d,
  };
}

test('robust size fit resists one extreme token-market-cap outlier', () => {
  const rows = tokenizedRows();
  const clean = fitValueModel(rows, { asOf });
  const contaminated = fitValueModel([
    ...rows,
    { ...rows[0], slug: 'extreme-outlier', mcap_usd: rows[0].mcap_usd * 1_000_000 },
  ], { asOf });
  assert.ok(Math.abs(contaminated.curve.slope - clean.curve.slope) < 0.12);
  assert.ok(Math.abs(contaminated.curve.intercept - clean.curve.intercept) < 1.0);
});

test('category residual effects are shrunk and capped', () => {
  const rows = tokenizedRows();
  rows.push(...Array.from({ length: 3 }, (_, i) => ({
    ...rows[i], slug: `tiny-category-${i}`, category: 'Tiny', mcap_usd: rows[i].mcap_usd * 100,
  })));
  const model = fitValueModel(rows, { asOf, categoryShrinkage: 8, categoryEffectCap: 1.0 });
  assert.ok(Math.abs(model.categories.Tiny.effect) <= 1.0);
  assert.ok(model.categories.Tiny.n === 3);
  assert.ok(Math.abs(model.categories.Tiny.effect) < Math.log(100));
});

test('launch value is positive, has ordered uncertainty bounds, and scales with TVL', () => {
  const model = fitValueModel(tokenizedRows(), { asOf });
  const smaller = predictLaunchValue(withPreToken('pre-small', 'DEX', 20_000_000), model, { asOf });
  const larger = predictLaunchValue(withPreToken('pre-large', 'DEX', 80_000_000), model, { asOf });
  assert.ok(smaller.lowUsd > 0);
  assert.ok(smaller.lowUsd <= smaller.valueUsd);
  assert.ok(smaller.valueUsd <= smaller.highUsd);
  assert.ok(larger.valueUsd > smaller.valueUsd);
});

test('growth and maturity adjustments stay bounded for extreme and missing inputs', () => {
  const model = fitValueModel(tokenizedRows(), { asOf });
  const surge = predictLaunchValue(withPreToken('surge', 'DEX', 10_000_000, '2026-11-14', 100_000), model, { asOf });
  const old = predictLaunchValue(withPreToken('old', 'DEX', 10_000_000, '2010-01-01', -100_000), model, { asOf });
  const unknown = predictLaunchValue(withPreToken('unknown', 'DEX', 10_000_000, null, null), model, { asOf });
  for (const p of [surge, old, unknown]) {
    assert.ok(p.growthMultiplier >= 0.85 && p.growthMultiplier <= 1.25);
    assert.ok(p.maturityMultiplier >= 0.85 && p.maturityMultiplier <= 1.0);
    assert.ok(p.lowUsd <= p.valueUsd && p.valueUsd <= p.highUsd);
  }
});

test('launch-odds model uses category and age cohorts with Bayesian smoothing', () => {
  const rows = tokenizedRows();
  rows.push(
    ...Array.from({ length: 12 }, (_, i) => withPreToken(`young-dex-${i}`, 'DEX', 1_000_000, '2026-10-01')),
    ...Array.from({ length: 8 }, (_, i) => ({
      ...withPreToken(`old-lend-${i}`, 'Lending', 1_000_000, '2020-01-01'),
      mcap_usd: i < 6 ? 100_000 : null,
      gecko_id: i < 6 ? `old-lend-${i}` : null,
      symbol: i < 6 ? `OL${i}` : null,
    })),
  );
  const odds = fitLaunchOdds(rows, { asOf });
  const young = predictLaunchOdds(withPreToken('candidate-young', 'DEX', 5_000_000, '2026-10-01'), odds, { asOf });
  const old = predictLaunchOdds(withPreToken('candidate-old', 'Lending', 5_000_000, '2020-01-01'), odds, { asOf });
  assert.ok(young.probability > 0 && young.probability < 1);
  assert.ok(old.probability > young.probability);
  assert.ok(young.low <= young.probability && young.probability <= young.high);
});

test('leave-one-out odds exclude the target from the cohort counts', () => {
  const rows = tokenizedRows();
  const target = rows[0];
  const inclusive = fitLaunchOdds(rows, { asOf });
  const excluded = fitLaunchOdds(rows, { asOf, excludeSlug: target.slug });
  const p1 = predictLaunchOdds(target, inclusive, { asOf });
  const p2 = predictLaunchOdds(target, excluded, { asOf });
  assert.notEqual(p1.trainingCount, p2.trainingCount);
  assert.equal(p2.trainingCount, rows.length - 1);
});

test('expected value and farm economics use conservative bounds and explicit costs', () => {
  const result = scoreExpectedValue(
    { valueUsd: 100_000_000, lowUsd: 30_000_000, highUsd: 250_000_000 },
    { probability: 0.4, low: 0.25, high: 0.6 },
    { farmerShare: 5e-6, gasCostUsd: 4, hours: 2, farmThresholdUsd: 20 },
  );
  assert.equal(result.expectedValueUsd, 40_000_000);
  assert.equal(result.conservativeGrossUsd, 37.5);
  assert.equal(result.netUsd, 33.5);
  assert.equal(result.verdict, 'FARM');
});

test('model fitting and predictions are deterministic under input reordering', () => {
  const rows = tokenizedRows();
  const a = fitValueModel(rows, { asOf });
  const b = fitValueModel([...rows].reverse(), { asOf });
  const p = withPreToken('stable', 'Lending', 25_000_000);
  assert.deepEqual(
    predictLaunchValue(p, a, { asOf }),
    predictLaunchValue(p, b, { asOf }),
  );
});

test('value-model backtest excludes each target from its own comparables', async () => {
  const { backtestValueModel } = await import('../lib/expected-value.mjs');
  const rows = tokenizedRows();
  const result = backtestValueModel(rows, { asOf });
  assert.equal(result.n, rows.length);
  assert.ok(result.medianAbsLogError >= 0);
  assert.ok(result.coverage80 >= 0 && result.coverage80 <= 1);
  assert.ok(result.rows.every((row) => row.trainingCount === rows.length - 1));
});

test('launch-odds cross-validation scores held-out rows against a base-rate baseline', async () => {
  const { crossValidateLaunchOdds } = await import('../lib/expected-value.mjs');
  const rows = tokenizedRows();
  rows.push(...Array.from({ length: 20 }, (_, i) => withPreToken(`pre-${i}`, i % 2 ? 'DEX' : 'Lending', 2_000_000, '2025-01-01')));
  const result = crossValidateLaunchOdds(rows, { asOf, folds: 5 });
  assert.equal(result.n, rows.length);
  assert.equal(result.folds, 5);
  assert.ok(result.brier >= 0 && result.brier <= 1);
  assert.ok(result.logLoss >= 0);
  assert.ok(result.baseRateBrier >= 0 && result.baseRateBrier <= 1);
});


test('rejects duplicate protocol slugs at the model boundary', () => {
  const rows = tokenizedRows();
  assert.throws(() => fitValueModel([...rows, rows[0]], { asOf }), /duplicate protocol slug/);
});

test('rejects an invalid probability interval before farm scoring', () => {
  assert.throws(() => scoreExpectedValue(
    { valueUsd: 10, lowUsd: 12, highUsd: 20 },
    { probability: 0.5, low: 0.2, high: 0.8 },
    { gasCostUsd: 1 },
  ), /positive ordered bounds/);
});
