// ═══════════════════════════════════════════════════════════════════════════════
// PRICING ENGINE — Mathematical Utilities
// Black-Scholes, Normal Distribution, Random Number Generation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Standard normal CDF (cumulative distribution function)
 * Abramowitz and Stegun approximation (max error ~1.5e-7)
 */
export function normCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Standard normal PDF
 */
export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Inverse normal CDF (rational approximation, Beasley-Springer-Moro)
 */
export function normInv(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  const a = [
    -3.969683028665376e+01, 2.209460984245205e+02,
    -2.759285104469687e+02, 1.383577518672690e+02,
    -3.066479806614716e+01, 2.506628277459239e+00,
  ];
  const b = [
    -5.447609879822406e+01, 1.615858368580409e+02,
    -1.556989798598866e+02, 6.680131188771972e+01,
    -1.328068155288572e+01,
  ];
  const c = [
    -7.784894002430293e-03, -3.223964580411365e-01,
    -2.400758277161838e+00, -2.549732539343734e+00,
    4.374664141464968e+00, 2.938163982698783e+00,
  ];
  const d = [
    7.784695709041462e-03, 3.224671290700398e-01,
    2.445134137142996e+00, 3.754408661907416e+00,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q /
      (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
}

// ── Black-Scholes ────────────────────────────────────────────────────────────

export interface BSParams {
  S: number;    // spot price
  K: number;    // strike price
  T: number;    // time to maturity (years)
  r: number;    // risk-free rate
  q: number;    // dividend yield
  sigma: number; // volatility
}

/**
 * Black-Scholes d1 and d2
 */
export function bsD1D2(p: BSParams): { d1: number; d2: number } {
  const d1 = (Math.log(p.S / p.K) + (p.r - p.q + 0.5 * p.sigma * p.sigma) * p.T) /
    (p.sigma * Math.sqrt(p.T));
  const d2 = d1 - p.sigma * Math.sqrt(p.T);
  return { d1, d2 };
}

/**
 * Black-Scholes European Call price
 */
export function bsCall(p: BSParams): number {
  if (p.T <= 0) return Math.max(p.S - p.K, 0);
  const { d1, d2 } = bsD1D2(p);
  return p.S * Math.exp(-p.q * p.T) * normCdf(d1) - p.K * Math.exp(-p.r * p.T) * normCdf(d2);
}

/**
 * Black-Scholes European Put price
 */
export function bsPut(p: BSParams): number {
  if (p.T <= 0) return Math.max(p.K - p.S, 0);
  const { d1, d2 } = bsD1D2(p);
  return p.K * Math.exp(-p.r * p.T) * normCdf(-d2) - p.S * Math.exp(-p.q * p.T) * normCdf(-d1);
}

/**
 * Black-Scholes Greeks (European)
 */
export function bsGreeks(p: BSParams, isCall: boolean): {
  delta: number; gamma: number; vega: number; theta: number; rho: number;
} {
  const { d1, d2 } = bsD1D2(p);
  const sqrtT = Math.sqrt(p.T);
  const expQ = Math.exp(-p.q * p.T);
  const expR = Math.exp(-p.r * p.T);

  const gamma = expQ * normPdf(d1) / (p.S * p.sigma * sqrtT);
  const vega = p.S * expQ * normPdf(d1) * sqrtT / 100; // per 1% vol move

  if (isCall) {
    return {
      delta: expQ * normCdf(d1),
      gamma,
      vega,
      theta: (-(p.S * normPdf(d1) * p.sigma * expQ) / (2 * sqrtT)
        - p.r * p.K * expR * normCdf(d2)
        + p.q * p.S * expQ * normCdf(d1)) / 365,
      rho: p.K * p.T * expR * normCdf(d2) / 100,
    };
  } else {
    return {
      delta: expQ * (normCdf(d1) - 1),
      gamma,
      vega,
      theta: (-(p.S * normPdf(d1) * p.sigma * expQ) / (2 * sqrtT)
        + p.r * p.K * expR * normCdf(-d2)
        - p.q * p.S * expQ * normCdf(-d1)) / 365,
      rho: -p.K * p.T * expR * normCdf(-d2) / 100,
    };
  }
}

/**
 * Zero-coupon bond price (continuous compounding)
 */
export function zeroCouponBond(r: number, T: number): number {
  return Math.exp(-r * T);
}

// ── Monte Carlo ──────────────────────────────────────────────────────────────

/**
 * Seeded pseudo-random number generator (Mulberry32)
 * Deterministic if seed is fixed
 */
export function createRng(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate standard normal random variable using Box-Muller
 */
export function boxMuller(rng: () => number): number {
  let u1: number, u2: number;
  do {
    u1 = rng();
    u2 = rng();
  } while (u1 <= 1e-10);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Generate correlated normal random variables using Cholesky decomposition
 */
export function choleskyDecompose(correlation: number[][]): number[][] {
  const n = correlation.length;
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0) as number[]);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i]![k]! * L[j]![k]!;
      }
      if (i === j) {
        L[i]![j] = Math.sqrt(Math.max(0, correlation[i]![i]! - sum));
      } else {
        const ljj = L[j]![j]!;
        L[i]![j] = ljj !== 0 ? (correlation[i]![j]! - sum) / ljj : 0;
      }
    }
  }
  return L;
}

/**
 * Generate GBM path for single underlying
 * Returns array of spot levels at each time step
 */
export function generateGBMPath(
  S0: number,
  r: number,
  q: number,
  sigma: number,
  T: number,
  steps: number,
  rng: () => number,
): number[] {
  const dt = T / steps;
  const drift = (r - q - 0.5 * sigma * sigma) * dt;
  const diffusion = sigma * Math.sqrt(dt);

  const path = new Array<number>(steps + 1);
  path[0] = S0;

  for (let i = 1; i <= steps; i++) {
    const z = boxMuller(rng);
    path[i] = path[i - 1]! * Math.exp(drift + diffusion * z);
  }

  return path;
}

/**
 * Generate correlated GBM paths for basket underlyings
 */
export function generateCorrelatedPaths(
  underlyings: { S0: number; r: number; q: number; sigma: number }[],
  correlationMatrix: number[][],
  T: number,
  steps: number,
  rng: () => number,
): number[][] {
  const n = underlyings.length;
  const L = choleskyDecompose(correlationMatrix);
  const dt = T / steps;

  const paths: number[][] = underlyings.map(() => new Array<number>(steps + 1));
  for (let i = 0; i < n; i++) {
    paths[i]![0] = underlyings[i]!.S0;
  }

  for (let t = 1; t <= steps; t++) {
    // Generate independent normals
    const z: number[] = [];
    for (let i = 0; i < n; i++) {
      z.push(boxMuller(rng));
    }

    // Apply Cholesky to correlate
    for (let i = 0; i < n; i++) {
      let correlatedZ = 0;
      for (let j = 0; j <= i; j++) {
        correlatedZ += L[i]![j]! * z[j]!;
      }

      const u = underlyings[i]!;
      const drift = (u.r - u.q - 0.5 * u.sigma * u.sigma) * dt;
      const diffusion = u.sigma * Math.sqrt(dt) * correlatedZ;
      paths[i]![t] = paths[i]![t - 1]! * Math.exp(drift + diffusion);
    }
  }

  return paths;
}

// ── Discount Helpers ─────────────────────────────────────────────────────────

/**
 * Discount a cashflow from time T to now
 */
export function discount(amount: number, rate: number, T: number): number {
  return amount * Math.exp(-rate * T);
}

/**
 * Year fraction between two dates (ACT/365)
 */
export function yearFraction(
  date1: string | Date,
  date2: string | Date,
  convention: string = 'ACT/365',
): number {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  const days = (d2 - d1) / (1000 * 60 * 60 * 24);

  switch (convention) {
    case 'ACT/360':
      return days / 360;
    case '30/360':
      return days / 360; // simplified
    case 'ACT/365':
    default:
      return days / 365;
  }
}
