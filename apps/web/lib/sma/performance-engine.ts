// ─── Performance engine — pure functions, no React deps ─────────────────────

/**
 * Computes an annualized rolling volatility series.
 * @param returns Monthly arithmetic returns (e.g. 0.01 = 1%).
 * @param windowSize Look-back in months (e.g. 12).
 * @returns An array of length `returns.length`; the first `windowSize - 1`
 *          entries are 0 (insufficient data).
 */
export function computeRollingVolatility(
  returns: number[],
  windowSize: number,
): number[] {
  if (windowSize <= 1) return returns.map(() => 0);
  const out: number[] = [];
  for (let i = 0; i < returns.length; i++) {
    if (i < windowSize - 1) {
      out.push(0);
      continue;
    }
    const win = returns.slice(i - windowSize + 1, i + 1);
    const mean = win.reduce((a, b) => a + b, 0) / win.length;
    const variance =
      win.reduce((s, r) => s + (r - mean) ** 2, 0) / (win.length - 1 || 1);
    // Annualize (monthly → yearly) and convert to percent.
    out.push(Number((Math.sqrt(variance) * Math.sqrt(12) * 100).toFixed(3)));
  }
  return out;
}

/**
 * Computes the maximum drawdown from a series of periodic returns.
 * @param returns Monthly returns.
 * @returns { maxDD: negative-or-zero percent, peakDate, troughDate }
 *          dates are indices into the original array.
 */
export function computeMaxDrawdown(returns: number[]): {
  maxDD: number;
  peakDate: number;
  troughDate: number;
} {
  let cum = 1;
  let peak = 1;
  let peakIdx = 0;
  let troughIdx = 0;
  let maxDD = 0;
  let currentPeakIdx = 0;

  for (let i = 0; i < returns.length; i++) {
    cum *= 1 + returns[i];
    if (cum > peak) {
      peak = cum;
      currentPeakIdx = i;
    }
    const dd = (cum - peak) / peak;
    if (dd < maxDD) {
      maxDD = dd;
      peakIdx = currentPeakIdx;
      troughIdx = i;
    }
  }

  return {
    maxDD: Number((maxDD * 100).toFixed(3)),
    peakDate: peakIdx,
    troughDate: troughIdx,
  };
}

/**
 * Annualized Sharpe ratio.
 * @param returns Monthly returns.
 * @param riskFreeRate Annual risk-free rate (e.g. 0.025 for 2.5%).
 */
export function computeSharpeRatio(
  returns: number[],
  riskFreeRate: number,
): number {
  const n = returns.length;
  if (n < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const rfMonthly = riskFreeRate / 12;
  const variance =
    returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (n - 1 || 1);
  const vol = Math.sqrt(variance);
  if (vol === 0) return 0;
  const annualized = ((mean - rfMonthly) * 12) / (vol * Math.sqrt(12));
  return Number(annualized.toFixed(3));
}

/**
 * Cumulative performance series, starting from 0%.
 * @param returns Monthly returns.
 * @returns Array of cumulative performances in percent (e.g. 5.2 = +5.2%).
 */
export function computeCumulativePerformance(returns: number[]): number[] {
  const out: number[] = [];
  let cum = 1;
  for (const r of returns) {
    cum *= 1 + r;
    out.push(Number(((cum - 1) * 100).toFixed(3)));
  }
  return out;
}
