// ═══════════════════════════════════════════════════════════════════════════════
// PRICING ENGINE — Core Types & Interfaces
// ═══════════════════════════════════════════════════════════════════════════════

// ── Underlying Definition ────────────────────────────────────────────────────

export interface UnderlyingDef {
  ticker: string;
  name: string;
  type: 'SINGLE_STOCK' | 'INDEX' | 'ETF';
  currency: string;
  spot: number;
  strikeLevel: number;       // reference level at inception
  volatility: number;        // annualized implied vol
  dividendYield: number;     // continuous dividend yield
  repoOrBorrowCost: number;  // borrow cost for shorts
}

export interface BasketDef {
  type: 'EQUAL' | 'CUSTOM' | 'WORST_OF' | 'BEST_OF';
  components: BasketComponent[];
  correlationMatrix: number[][]; // N x N correlation matrix
}

export interface BasketComponent {
  underlying: UnderlyingDef;
  weight: number; // 0-1, sum = 1 for equal/custom
}

// ── Schedule / Dates ─────────────────────────────────────────────────────────

export interface ProductSchedule {
  tradeDate: string;           // ISO date
  pricingDate: string;
  issueDate: string;
  strikeDate: string;
  initialFixingDate: string;
  maturityDate: string;
  finalValuationDate: string;
  finalSettlementDate: string;
  couponObservationDates: string[];
  couponPaymentDates: string[];
  autocallObservationDates: string[];
  autocallPaymentDates: string[];
  dayCountConvention: 'ACT/360' | 'ACT/365' | '30/360';
  businessDayConvention: 'FOLLOWING' | 'MODIFIED_FOLLOWING' | 'PRECEDING';
}

// ── Payoff Parameters ────────────────────────────────────────────────────────

export interface PayoffParams {
  strike: number;                          // 100% typically
  participationUp: number;                 // upside gearing, e.g. 1.0
  participationDown: number;               // downside gearing
  couponType: 'FIXED' | 'CONDITIONAL' | 'MEMORY' | 'ACCUMULATOR' | 'NONE';
  couponRate: number;                      // annual coupon, e.g. 0.08 = 8%
  couponFrequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  couponBarrier: number;                   // % of strike, e.g. 0.70 = 70%
  couponMemory: boolean;
  autocallEnabled: boolean;
  autocallBarrier: number;                 // % of strike
  autocallStepDown: number[];              // per-period barriers, empty if flat
  protectionType: 'NONE' | 'FULL' | 'PARTIAL' | 'BARRIER';
  protectionBarrier: number;               // capital protection level, e.g. 0.60
  capitalGuaranteeLevel: number;           // 0-1, e.g. 1.0 = 100% protected
  knockInLevel: number;                    // barrier for KI, 0 if none
  knockOutLevel: number;                   // barrier for KO, 0 if none
  barrierMonitoring: 'EUROPEAN' | 'CONTINUOUS' | 'DAILY_CLOSE';
  cap: number;                             // max return, 0 = uncapped
  floor: number;                           // min return, 0 = no floor
  digitalTrigger: number;                  // digital payoff trigger, 0 if none
  cashSettlement: boolean;
}

// ── Market Parameters ────────────────────────────────────────────────────────

export interface MarketParams {
  riskFreeRate: number;        // continuous risk-free rate
  discountCurve: number[];     // term structure points
  fundingSpread: number;       // issuer funding spread
  issuerSpread: number;        // credit spread
  structuringMargin: number;   // manufacturing margin
  distributionFee: number;     // distribution fee
  executionCost: number;       // execution/hedging cost
}

// ── Full Product Configuration ───────────────────────────────────────────────

export interface StructuredProductConfig {
  productId?: string;
  internalRef?: string;
  productName: string;
  structureType: string;
  currency: string;
  nominalAmount: number;
  denomination: number;
  minimumSubscription: number;
  issuePriceTarget: number;     // typically 100
  underlying: UnderlyingDef;
  basket?: BasketDef;
  schedule: ProductSchedule;
  payoff: PayoffParams;
  market: MarketParams;
  // Monte Carlo settings
  mcPaths: number;
  mcSeed: number;
  observationFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

// ── Pricing Result ───────────────────────────────────────────────────────────

export interface PricingResult {
  fairValue: number;
  issuePrice: number;
  indicativeCoupon: number | null;
  expectedRedemption: number;
  expectedReturn: number;
  annualizedReturn: number;
  breakEven: number | null;
  maxGain: number;
  maxLoss: number;
  scenarioTable: ScenarioRow[];
  costBreakdown: CostBreakdown;
  riskSummary: RiskSummary;
  greeksApprox: GreeksApprox;
  payoffChartData: PayoffPoint[];
  modelUsed: string;
  modelLimitations: string[];
  assumptions: string[];
  warnings: string[];
  computeTimeMs: number;
}

export interface ScenarioRow {
  spotShock: number;          // e.g. -0.50, -0.30, 0, +0.30
  spotLevel: number;          // absolute spot level
  redemption: number;         // terminal payoff %
  totalCoupons: number;       // total coupons received %
  totalReturn: number;        // total return %
  annualizedReturn: number;
  autocallProbability: number;
  couponProbability: number;
  capitalLossProbability: number;
}

export interface CostBreakdown {
  structuringMargin: number;
  distributionFee: number;
  executionCost: number;
  hedgingCost: number;
  totalCost: number;
}

export interface RiskSummary {
  probAutocall: number;
  probCouponPayment: number;
  probCapitalLoss: number;
  probBarrierBreach: number;
  expectedLossGivenDefault: number;
  valueAtRisk95: number;
  conditionalVaR95: number;
}

export interface GreeksApprox {
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

export interface PayoffPoint {
  spot: number;
  payoff: number;
}

// ── Validation ───────────────────────────────────────────────────────────────

export interface ValidationError {
  code: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  field: string;
  message: string;
  suggestedFix?: string;
}
