const DEFAULTS = Object.freeze({
  categoryShrinkage: 8,
  categoryEffectCap: 1.0,
  huberK: 1.345,
  fitIterations: 12,
  growthScalePct: 50,
  growthWeight: 0.2,
  growthFloor: 0.85,
  growthCeiling: 1.25,
  maturityFloor: 0.85,
  maturitySpanDays: 1095,
  unknownAgeDays: 365,
  intervalZ80: 1.2815515655446004,
  oddsCategoryPrior: 8,
  oddsAgePrior: 5,
  oddsBetaAlpha: 1,
  oddsBetaBeta: 1,
  farmerShare: 5e-6,
  farmThresholdUsd: 20,
});

const DAY_MS = 86_400_000;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const categoryOf = (row) => typeof row.category === 'string' && row.category.trim() ? row.category.trim() : 'Uncategorised';
const slugOf = (row) => String(row.slug ?? '');

function assertUniqueSlugs(protocols) {
  const seen = new Set();
  for (const row of protocols) {
    const slug = slugOf(row);
    if (!slug) throw new TypeError('every protocol must have a non-empty slug.');
    if (seen.has(slug)) throw new TypeError('duplicate protocol slug: ' + slug);
    seen.add(slug);
  }
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function quantile(values, q) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = clamp(q, 0, 1) * (sorted.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function robustScale(values) {
  if (values.length < 2) return 0.05;
  const center = median(values);
  const mad = median(values.map((value) => Math.abs(value - center)));
  if (mad > 1e-10) return Math.max(0.05, 1.4826 * mad);
  const iqr = quantile(values, 0.75) - quantile(values, 0.25);
  return Math.max(0.05, iqr / 1.349);
}

function weightedLine(points, weights) {
  let sw = 0;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < points.length; i += 1) {
    const weight = weights[i];
    const { x, y } = points[i];
    sw += weight;
    sx += weight * x;
    sy += weight * y;
    sxx += weight * x * x;
    sxy += weight * x * y;
  }
  const denominator = sw * sxx - sx * sx;
  if (Math.abs(denominator) < 1e-12) throw new Error('Value model requires variation in log(TVL).');
  const slope = (sw * sxy - sx * sy) / denominator;
  return { intercept: (sy - slope * sx) / sw, slope };
}

function fitRobustCurve(rows, options) {
  const points = rows.map((row) => ({ x: Math.log(row.tvl_usd), y: Math.log(row.mcap_usd) }));
  let weights = points.map(() => 1);
  let curve = weightedLine(points, weights);
  for (let iteration = 0; iteration < options.fitIterations; iteration += 1) {
    const residuals = points.map(({ x, y }) => y - (curve.intercept + curve.slope * x));
    const scale = robustScale(residuals);
    const cutoff = options.huberK * scale;
    weights = residuals.map((residual) => {
      const absolute = Math.abs(residual);
      return absolute <= cutoff ? 1 : cutoff / absolute;
    });
    curve = weightedLine(points, weights);
  }
  const residuals = points.map(({ x, y }) => y - (curve.intercept + curve.slope * x));
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const total = points.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0);
  const residual = points.reduce((sum, point, index) => sum + residuals[index] ** 2, 0);
  return {
    intercept: curve.intercept,
    slope: curve.slope,
    r2: total > 0 ? 1 - residual / total : 0,
    n: rows.length,
    residualSigma: robustScale(residuals),
  };
}

function ageDays(asOf, listedAt) {
  if (typeof listedAt !== 'string' || !listedAt) return null;
  const end = Date.parse(`${asOf}T00:00:00Z`);
  const start = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(end) || !Number.isFinite(start)) return null;
  return Math.max(0, Math.floor((end - start) / DAY_MS));
}

function ageBucket(days) {
  if (days === null) return 'unknown';
  if (days <= 180) return '0-180d';
  if (days <= 365) return '181-365d';
  if (days <= 730) return '366-730d';
  return '731d+';
}

function validateAsOf(asOf) {
  if (typeof asOf !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(asOf) || !Number.isFinite(Date.parse(`${asOf}T00:00:00Z`))) {
    throw new TypeError('asOf must be a valid YYYY-MM-DD date.');
  }
}

/** Fit a robust log-log token market-cap/TVL curve plus shrunken category residuals. */
export function fitValueModel(protocols, config = {}) {
  if (!Array.isArray(protocols)) throw new TypeError('protocols must be an array.');
  const options = { ...DEFAULTS, ...config };
  validateAsOf(options.asOf);
  assertUniqueSlugs(protocols);
  const comparables = protocols
    .filter((row) => slugOf(row) !== options.excludeSlug && finite(row.tvl_usd) && row.tvl_usd > 0 && finite(row.mcap_usd) && row.mcap_usd > 0)
    .map((row) => ({ ...row, category: categoryOf(row), slug: slugOf(row) }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  if (comparables.length < 3) throw new Error('Value model requires at least three positive-market-cap comparables.');
  const curve = fitRobustCurve(comparables, options);
  const residualRows = comparables.map((row) => ({
    ...row,
    residual: Math.log(row.mcap_usd) - (curve.intercept + curve.slope * Math.log(row.tvl_usd)),
  }));
  const grouped = new Map();
  for (const row of residualRows) {
    if (!grouped.has(row.category)) grouped.set(row.category, []);
    grouped.get(row.category).push(row.residual);
  }
  const categories = {};
  for (const category of [...grouped.keys()].sort()) {
    const residuals = grouped.get(category);
    const rawEffect = median(residuals);
    const shrinkage = residuals.length / (residuals.length + options.categoryShrinkage);
    categories[category] = {
      n: residuals.length,
      rawMedianResidual: rawEffect,
      effect: clamp(rawEffect * shrinkage, -options.categoryEffectCap, options.categoryEffectCap),
      residualSigma: robustScale(residuals),
    };
  }
  return Object.freeze({
    version: 'midad-expected-value-v1',
    asOf: options.asOf,
    curve,
    categories,
    residualSigma: curve.residualSigma,
    comparableCount: comparables.length,
    constants: Object.freeze({
      categoryShrinkage: options.categoryShrinkage,
      categoryEffectCap: options.categoryEffectCap,
      growthScalePct: options.growthScalePct,
      growthWeight: options.growthWeight,
      growthFloor: options.growthFloor,
      growthCeiling: options.growthCeiling,
      maturityFloor: options.maturityFloor,
      maturitySpanDays: options.maturitySpanDays,
      unknownAgeDays: options.unknownAgeDays,
      intervalZ80: options.intervalZ80,
    }),
  });
}

/** Predict token market cap and a central 80% log-scale interval for one pre-token protocol. */
export function predictLaunchValue(protocol, model, config = {}) {
  if (!protocol || !model?.curve) throw new TypeError('protocol and a fitted value model are required.');
  const options = { ...DEFAULTS, ...config };
  const tvl = protocol.tvl_usd;
  if (!finite(tvl) || tvl <= 0) throw new TypeError('protocol.tvl_usd must be a positive finite number.');
  const category = categoryOf(protocol);
  const categoryEffect = model.categories[category]?.effect ?? 0;
  const days = ageDays(options.asOf ?? model.asOf, protocol.listed_at);
  const effectiveAge = days ?? options.unknownAgeDays;
  const change = finite(protocol.change_7d) ? protocol.change_7d : 0;
  const growthMultiplier = clamp(
    1 + options.growthWeight * Math.tanh(change / options.growthScalePct),
    options.growthFloor,
    options.growthCeiling,
  );
  const maturityMultiplier = clamp(
    options.maturityFloor + (1 - options.maturityFloor) * Math.min(effectiveAge, options.maturitySpanDays) / options.maturitySpanDays,
    options.maturityFloor,
    1,
  );
  const logBase = model.curve.intercept + model.curve.slope * Math.log(tvl) + categoryEffect;
  const valueUsd = clamp(Math.round(Math.exp(logBase) * growthMultiplier * maturityMultiplier), 1, 1e15);
  const categoryN = model.categories[category]?.n ?? 0;
  const sigma = Math.sqrt(model.residualSigma ** 2 * (1 + 1 / (categoryN + options.categoryShrinkage)));
  const spread = options.intervalZ80 * sigma;
  const lowUsd = clamp(Math.floor(valueUsd * Math.exp(-spread)), 1, valueUsd);
  const highUsd = clamp(Math.ceil(valueUsd * Math.exp(spread)), valueUsd, 1e15);
  return {
    valueUsd,
    lowUsd,
    highUsd,
    category,
    categoryEffect,
    categoryComparableCount: categoryN,
    growthMultiplier,
    maturityMultiplier,
    ageDays: days,
    sigmaLog: sigma,
    modelVersion: model.version,
  };
}

function hasToken(row) {
  return (row.mcap_usd !== null && row.mcap_usd !== undefined)
    || (row.gecko_id !== null && row.gecko_id !== undefined)
    || (row.symbol !== null && row.symbol !== undefined);
}

/** Fit a hierarchical Beta-smoothed token-issuance model; excludeSlug supports leakage-free LOO tests. */
export function fitLaunchOdds(protocols, config = {}) {
  if (!Array.isArray(protocols)) throw new TypeError('protocols must be an array.');
  const options = { ...DEFAULTS, ...config };
  validateAsOf(options.asOf);
  assertUniqueSlugs(protocols);
  const rows = protocols.filter((row) => slugOf(row) !== options.excludeSlug).map((row) => ({
    category: categoryOf(row),
    bucket: ageBucket(ageDays(options.asOf, row.listed_at)),
    success: hasToken(row) ? 1 : 0,
  }));
  if (!rows.length) throw new Error('Launch-odds model requires at least one training protocol.');
  const successes = rows.reduce((sum, row) => sum + row.success, 0);
  const baseRate = (successes + options.oddsBetaAlpha) / (rows.length + options.oddsBetaAlpha + options.oddsBetaBeta);
  const categoryCounts = new Map();
  const cellCounts = new Map();
  for (const row of rows) {
    if (!categoryCounts.has(row.category)) categoryCounts.set(row.category, { n: 0, successes: 0 });
    const category = categoryCounts.get(row.category);
    category.n += 1;
    category.successes += row.success;
    const key = `${row.category}\\u0000${row.bucket}`;
    if (!cellCounts.has(key)) cellCounts.set(key, { n: 0, successes: 0, category: row.category, bucket: row.bucket });
    const cell = cellCounts.get(key);
    cell.n += 1;
    cell.successes += row.success;
  }
  const categories = {};
  for (const category of [...categoryCounts.keys()].sort()) {
    const counts = categoryCounts.get(category);
    categories[category] = {
      n: counts.n,
      successes: counts.successes,
      probability: (counts.successes + options.oddsCategoryPrior * baseRate) / (counts.n + options.oddsCategoryPrior),
    };
  }
  const cells = {};
  for (const cell of [...cellCounts.values()].sort((a, b) => `${a.category}:${a.bucket}`.localeCompare(`${b.category}:${b.bucket}`))) {
    const categoryRate = categories[cell.category].probability;
    const alpha = cell.successes + options.oddsAgePrior * categoryRate;
    const beta = (cell.n - cell.successes) + options.oddsAgePrior * (1 - categoryRate);
    cells[`${cell.category}:${cell.bucket}`] = {
      n: cell.n,
      successes: cell.successes,
      alpha,
      beta,
      probability: alpha / (alpha + beta),
    };
  }
  return Object.freeze({
    version: 'midad-launch-odds-v1',
    asOf: options.asOf,
    baseRate,
    categories,
    cells,
    trainingCount: rows.length,
    tokenizedCount: successes,
    constants: Object.freeze({
      categoryPrior: options.oddsCategoryPrior,
      agePrior: options.oddsAgePrior,
      betaAlpha: options.oddsBetaAlpha,
      betaBeta: options.oddsBetaBeta,
    }),
  });
}

/** Predict launch probability and a normal-approximation 80% posterior interval. */
export function predictLaunchOdds(protocol, model, config = {}) {
  if (!protocol || !model?.categories) throw new TypeError('protocol and a fitted launch-odds model are required.');
  const options = { ...DEFAULTS, ...config };
  const category = categoryOf(protocol);
  const bucket = ageBucket(ageDays(options.asOf ?? model.asOf, protocol.listed_at));
  const cell = model.cells[`${category}:${bucket}`];
  const categoryRow = model.categories[category];
  const probability = cell?.probability ?? categoryRow?.probability ?? model.baseRate;
  const alpha = cell?.alpha ?? (categoryRow ? categoryRow.n * categoryRow.probability : 0) + options.oddsBetaAlpha;
  const beta = cell?.beta ?? (categoryRow ? categoryRow.n * (1 - categoryRow.probability) : 0) + options.oddsBetaBeta;
  const total = alpha + beta;
  const variance = alpha * beta / (total * total * (total + 1));
  const spread = options.intervalZ80 * Math.sqrt(Math.max(0, variance));
  return {
    probability: clamp(probability, 0, 1),
    low: clamp(probability - spread, 0, probability),
    high: clamp(probability + spread, probability, 1),
    category,
    ageBucket: bucket,
    trainingCount: model.trainingCount,
    cohortCount: cell?.n ?? 0,
    categoryCount: categoryRow?.n ?? 0,
    modelVersion: model.version,
  };
}

/** Combine launch value and issuance odds, then net the conservative farmer share against explicit costs. */
export function scoreExpectedValue(value, odds, economics = {}) {
  const farmerShare = economics.farmerShare ?? DEFAULTS.farmerShare;
  const gasCostUsd = economics.gasCostUsd ?? 0;
  const hours = economics.hours ?? 0;
  const farmThresholdUsd = economics.farmThresholdUsd ?? DEFAULTS.farmThresholdUsd;
  if (!value || !odds || !finite(value.valueUsd) || !finite(value.lowUsd) || !finite(value.highUsd) || value.lowUsd <= 0 || value.lowUsd > value.valueUsd || value.valueUsd > value.highUsd) throw new TypeError('value prediction must have positive ordered bounds.');
  if (!finite(odds.probability) || !finite(odds.low) || !finite(odds.high) || odds.low < 0 || odds.low > odds.probability || odds.probability > odds.high || odds.high > 1) throw new TypeError('odds prediction must have ordered probabilities between 0 and 1.');
  if (!(finite(farmerShare) && farmerShare >= 0 && farmerShare <= 1)) throw new TypeError('farmerShare must be between 0 and 1.');
  if (!(finite(gasCostUsd) && gasCostUsd >= 0)) throw new TypeError('gasCostUsd must be non-negative.');
  if (!(finite(hours) && hours >= 0)) throw new TypeError('hours must be non-negative.');
  const expectedValueUsd = value.valueUsd * odds.probability;
  const lowExpectedValueUsd = value.lowUsd * odds.low;
  const highExpectedValueUsd = value.highUsd * odds.high;
  const conservativeGrossUsd = lowExpectedValueUsd * farmerShare;
  const netUsd = conservativeGrossUsd - gasCostUsd;
  return {
    expectedValueUsd,
    lowExpectedValueUsd,
    highExpectedValueUsd,
    conservativeGrossUsd,
    gasCostUsd,
    netUsd,
    hours,
    netPerHourUsd: hours > 0 ? netUsd / hours : null,
    farmerShare,
    verdict: netUsd >= farmThresholdUsd ? 'FARM' : netUsd >= 0 ? 'THIN' : 'SKIP',
  };
}

/** Leave-one-out market-cap backtest; each tokenized target is excluded from its own fit. */
export function backtestValueModel(protocols, config = {}) {
  if (!Array.isArray(protocols)) throw new TypeError('protocols must be an array.');
  const options = { ...DEFAULTS, ...config };
  validateAsOf(options.asOf);
  assertUniqueSlugs(protocols);
  const targets = protocols
    .filter((row) => finite(row.tvl_usd) && row.tvl_usd > 0 && finite(row.mcap_usd) && row.mcap_usd > 0)
    .slice()
    .sort((a, b) => slugOf(a).localeCompare(slugOf(b)));
  if (targets.length < 4) throw new Error('Value-model backtest requires at least four positive-market-cap comparables.');
  const rows = targets.map((target) => {
    const model = fitValueModel(protocols, { ...options, excludeSlug: slugOf(target) });
    const prediction = predictLaunchValue(target, model, options);
    const baselineValueUsd = target.tvl_usd * 0.25 * prediction.growthMultiplier * prediction.maturityMultiplier;
    const logError = Math.log(prediction.valueUsd / target.mcap_usd);
    const baselineLogError = Math.log(baselineValueUsd / target.mcap_usd);
    return {
      slug: slugOf(target),
      actualValueUsd: target.mcap_usd,
      predictedValueUsd: prediction.valueUsd,
      lowUsd: prediction.lowUsd,
      highUsd: prediction.highUsd,
      baselineValueUsd,
      logError,
      baselineLogError,
      inside80: target.mcap_usd >= prediction.lowUsd && target.mcap_usd <= prediction.highUsd,
      trainingCount: model.comparableCount,
    };
  });
  const absolute = rows.map((row) => Math.abs(row.logError));
  const baselineAbsolute = rows.map((row) => Math.abs(row.baselineLogError));
  const rmse = Math.sqrt(rows.reduce((sum, row) => sum + row.logError ** 2, 0) / rows.length);
  const baselineRmse = Math.sqrt(rows.reduce((sum, row) => sum + row.baselineLogError ** 2, 0) / rows.length);
  return {
    n: rows.length,
    medianAbsLogError: median(absolute),
    rmseLogError: rmse,
    meanLogError: rows.reduce((sum, row) => sum + row.logError, 0) / rows.length,
    coverage80: rows.filter((row) => row.inside80).length / rows.length,
    baselineMedianAbsLogError: median(baselineAbsolute),
    baselineRmseLogError: baselineRmse,
    rows,
  };
}

function stableHash(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Deterministic held-out evaluation of issuance odds against a constant base-rate predictor. */
export function crossValidateLaunchOdds(protocols, config = {}) {
  if (!Array.isArray(protocols)) throw new TypeError('protocols must be an array.');
  const options = { ...DEFAULTS, ...config };
  validateAsOf(options.asOf);
  assertUniqueSlugs(protocols);
  const rows = [...protocols].sort((a, b) => slugOf(a).localeCompare(slugOf(b)));
  const folds = options.folds ?? 5;
  if (!Number.isInteger(folds) || folds < 2 || folds > rows.length) throw new TypeError('folds must be an integer from 2 through the protocol count.');
  const scored = [];
  for (let fold = 0; fold < folds; fold += 1) {
    const heldOut = rows.filter((row) => stableHash(slugOf(row)) % folds === fold);
    const training = rows.filter((row) => stableHash(slugOf(row)) % folds !== fold);
    if (!heldOut.length || !training.length) continue;
    const model = fitLaunchOdds(training, options);
    for (const row of heldOut) {
      const prediction = predictLaunchOdds(row, model, options).probability;
      const actual = hasToken(row) ? 1 : 0;
      const safe = clamp(prediction, 1e-6, 1 - 1e-6);
      const base = clamp(model.baseRate, 1e-6, 1 - 1e-6);
      scored.push({
        slug: slugOf(row),
        actual,
        predicted: safe,
        basePredicted: base,
        fold,
      });
    }
  }
  if (scored.length !== rows.length) throw new Error('Cross-validation did not score every protocol exactly once.');
  const brier = scored.reduce((sum, row) => sum + (row.predicted - row.actual) ** 2, 0) / scored.length;
  const logLoss = -scored.reduce((sum, row) => sum + row.actual * Math.log(row.predicted) + (1 - row.actual) * Math.log(1 - row.predicted), 0) / scored.length;
  const baseRateBrier = scored.reduce((sum, row) => sum + (row.basePredicted - row.actual) ** 2, 0) / scored.length;
  const baseRateLogLoss = -scored.reduce((sum, row) => sum + row.actual * Math.log(row.basePredicted) + (1 - row.actual) * Math.log(1 - row.basePredicted), 0) / scored.length;
  const calibration = Array.from({ length: 10 }, (_, bin) => {
    const lower = bin / 10;
    const upper = (bin + 1) / 10;
    const group = scored.filter((row) => row.predicted >= lower && (bin === 9 ? row.predicted <= 1 : row.predicted < upper));
    return group.length ? {
      bin: `${Math.round(lower * 100)}-${Math.round(upper * 100)}%`,
      n: group.length,
      meanPredicted: group.reduce((sum, row) => sum + row.predicted, 0) / group.length,
      observedRate: group.reduce((sum, row) => sum + row.actual, 0) / group.length,
    } : null;
  }).filter(Boolean);
  return {
    n: scored.length,
    folds,
    brier,
    logLoss,
    baseRateBrier,
    baseRateLogLoss,
    calibration,
    rows: scored,
  };
}
