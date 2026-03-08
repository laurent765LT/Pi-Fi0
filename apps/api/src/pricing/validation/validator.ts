// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT VALIDATION ENGINE
// Business-rule validation for structured product configurations
// ═══════════════════════════════════════════════════════════════════════════════

import { type StructuredProductConfig, type ValidationError } from '../core/types';

/**
 * Validate a full structured product configuration.
 * Returns an array of errors (empty = valid).
 */
export function validateProductConfig(config: StructuredProductConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // ── Required fields ───────────────────────────────────────────────────────
  if (!config.productName?.trim()) {
    errors.push({
      code: 'MISSING_NAME',
      severity: 'ERROR',
      field: 'productName',
      message: 'Le nom du produit est obligatoire.',
    });
  }

  if (!config.structureType) {
    errors.push({
      code: 'MISSING_STRUCTURE',
      severity: 'ERROR',
      field: 'structureType',
      message: 'Le type de structure est obligatoire.',
    });
  }

  if (!config.currency) {
    errors.push({
      code: 'MISSING_CURRENCY',
      severity: 'ERROR',
      field: 'currency',
      message: 'La devise est obligatoire.',
    });
  }

  // ── Nominal & Denomination ────────────────────────────────────────────────
  if (config.nominalAmount <= 0) {
    errors.push({
      code: 'INVALID_NOMINAL',
      severity: 'ERROR',
      field: 'nominalAmount',
      message: 'Le montant nominal doit être strictement positif.',
      suggestedFix: 'Saisir un montant ≥ 1 000 €.',
    });
  }

  if (config.denomination <= 0) {
    errors.push({
      code: 'INVALID_DENOMINATION',
      severity: 'ERROR',
      field: 'denomination',
      message: 'La dénomination doit être strictement positive.',
    });
  }

  if (config.nominalAmount > 0 && config.denomination > 0 && config.nominalAmount < config.denomination) {
    errors.push({
      code: 'NOMINAL_BELOW_DENOM',
      severity: 'ERROR',
      field: 'nominalAmount',
      message: 'Le nominal ne peut pas être inférieur à la dénomination.',
    });
  }

  // ── Underlying ────────────────────────────────────────────────────────────
  if (!config.underlying?.ticker) {
    errors.push({
      code: 'MISSING_UNDERLYING',
      severity: 'ERROR',
      field: 'underlying.ticker',
      message: 'Le sous-jacent est obligatoire.',
    });
  }

  if (config.underlying?.spot <= 0) {
    errors.push({
      code: 'INVALID_SPOT',
      severity: 'ERROR',
      field: 'underlying.spot',
      message: 'Le prix spot doit être strictement positif.',
    });
  }

  if (config.underlying?.volatility < 0 || config.underlying?.volatility > 3) {
    errors.push({
      code: 'INVALID_VOL',
      severity: 'WARNING',
      field: 'underlying.volatility',
      message: `La volatilité (${(config.underlying.volatility * 100).toFixed(1)}%) semble anormale.`,
      suggestedFix: 'La volatilité implicite est généralement entre 10% et 80%.',
    });
  }

  // ── Basket validation ─────────────────────────────────────────────────────
  if (config.basket && config.basket.components.length > 1) {
    const n = config.basket.components.length;

    if (config.basket.correlationMatrix.length !== n) {
      errors.push({
        code: 'CORRELATION_MATRIX_SIZE',
        severity: 'ERROR',
        field: 'basket.correlationMatrix',
        message: `La matrice de corrélation doit être ${n}×${n} (${config.basket.correlationMatrix.length} lignes trouvées).`,
      });
    }

    if (config.basket.type === 'EQUAL' || config.basket.type === 'CUSTOM') {
      const totalWeight = config.basket.components.reduce((s, c) => s + c.weight, 0);
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        errors.push({
          code: 'WEIGHTS_NOT_SUMMING',
          severity: 'ERROR',
          field: 'basket.components',
          message: `La somme des poids du basket doit être égale à 1 (actuellement ${totalWeight.toFixed(4)}).`,
        });
      }
    }

    if (n > 10) {
      errors.push({
        code: 'TOO_MANY_COMPONENTS',
        severity: 'WARNING',
        field: 'basket.components',
        message: 'Un basket de plus de 10 composants peut entraîner des temps de calcul élevés.',
      });
    }
  }

  // ── Schedule ──────────────────────────────────────────────────────────────
  if (!config.schedule?.strikeDate || !config.schedule?.maturityDate) {
    errors.push({
      code: 'MISSING_DATES',
      severity: 'ERROR',
      field: 'schedule',
      message: 'Les dates de strike et maturité sont obligatoires.',
    });
  } else {
    const strike = new Date(config.schedule.strikeDate).getTime();
    const maturity = new Date(config.schedule.maturityDate).getTime();

    if (maturity <= strike) {
      errors.push({
        code: 'MATURITY_BEFORE_STRIKE',
        severity: 'ERROR',
        field: 'schedule.maturityDate',
        message: 'La date de maturité doit être postérieure à la date de strike.',
      });
    }

    const daysToMaturity = (maturity - strike) / (1000 * 60 * 60 * 24);
    if (daysToMaturity > 3660) { // ~10 years
      errors.push({
        code: 'MATURITY_TOO_LONG',
        severity: 'WARNING',
        field: 'schedule.maturityDate',
        message: `La maturité (${Math.round(daysToMaturity / 365)} ans) est très longue. Vérifiez que c'est correct.`,
      });
    }

    if (daysToMaturity < 30) {
      errors.push({
        code: 'MATURITY_TOO_SHORT',
        severity: 'WARNING',
        field: 'schedule.maturityDate',
        message: 'La maturité est inférieure à 1 mois, ce qui est inhabituel pour un produit structuré.',
      });
    }
  }

  // ── Payoff ────────────────────────────────────────────────────────────────
  const payoff = config.payoff;

  if (payoff.couponRate < 0 || payoff.couponRate > 1) {
    errors.push({
      code: 'INVALID_COUPON_RATE',
      severity: 'ERROR',
      field: 'payoff.couponRate',
      message: `Le taux de coupon (${(payoff.couponRate * 100).toFixed(2)}%) doit être entre 0% et 100%.`,
    });
  }

  if (payoff.couponType === 'CONDITIONAL' || payoff.couponType === 'MEMORY') {
    if (payoff.couponBarrier <= 0 || payoff.couponBarrier > 1.5) {
      errors.push({
        code: 'INVALID_COUPON_BARRIER',
        severity: 'ERROR',
        field: 'payoff.couponBarrier',
        message: 'La barrière de coupon doit être entre 0% et 150% du strike.',
      });
    }
  }

  if (payoff.autocallEnabled) {
    if (payoff.autocallBarrier <= 0 || payoff.autocallBarrier > 2) {
      errors.push({
        code: 'INVALID_AUTOCALL_BARRIER',
        severity: 'ERROR',
        field: 'payoff.autocallBarrier',
        message: 'La barrière d\'autocall doit être entre 0% et 200% du strike.',
      });
    }

    if (payoff.autocallBarrier < payoff.couponBarrier) {
      errors.push({
        code: 'AUTOCALL_BELOW_COUPON',
        severity: 'WARNING',
        field: 'payoff.autocallBarrier',
        message: 'La barrière d\'autocall est inférieure à la barrière de coupon — c\'est inhabituel.',
      });
    }
  }

  if (payoff.protectionType === 'BARRIER') {
    if (payoff.protectionBarrier <= 0 || payoff.protectionBarrier >= 1) {
      errors.push({
        code: 'INVALID_PROTECTION_BARRIER',
        severity: 'ERROR',
        field: 'payoff.protectionBarrier',
        message: 'La barrière de protection doit être entre 0% et 100% (exclusif) du strike.',
        suggestedFix: 'Valeurs typiques : 50%-80%.',
      });
    }
  }

  if (payoff.capitalGuaranteeLevel > 0 && payoff.capitalGuaranteeLevel < 0.8) {
    errors.push({
      code: 'LOW_CAPITAL_GUARANTEE',
      severity: 'WARNING',
      field: 'payoff.capitalGuaranteeLevel',
      message: `Garantie de capital à ${(payoff.capitalGuaranteeLevel * 100).toFixed(0)}% — c'est inhabituel. Vérifiez.`,
    });
  }

  if (payoff.cap > 0 && payoff.cap < 0.01) {
    errors.push({
      code: 'VERY_LOW_CAP',
      severity: 'WARNING',
      field: 'payoff.cap',
      message: 'Le cap est très bas (<1%), le rendement sera très limité.',
    });
  }

  // ── Market parameters ─────────────────────────────────────────────────────
  if (config.market.riskFreeRate < -0.02 || config.market.riskFreeRate > 0.15) {
    errors.push({
      code: 'UNUSUAL_RISK_FREE',
      severity: 'WARNING',
      field: 'market.riskFreeRate',
      message: `Taux sans risque (${(config.market.riskFreeRate * 100).toFixed(2)}%) semble inhabituel.`,
    });
  }

  if (config.market.structuringMargin < 0) {
    errors.push({
      code: 'NEGATIVE_MARGIN',
      severity: 'ERROR',
      field: 'market.structuringMargin',
      message: 'La marge de structuration ne peut pas être négative.',
    });
  }

  const totalFees = config.market.structuringMargin + config.market.distributionFee + config.market.executionCost;
  if (totalFees > 0.10) {
    errors.push({
      code: 'HIGH_TOTAL_FEES',
      severity: 'WARNING',
      field: 'market',
      message: `Les frais totaux (${(totalFees * 100).toFixed(2)}%) sont élevés. Cela impactera significativement le rendement client.`,
    });
  }

  // ── Monte Carlo settings ──────────────────────────────────────────────────
  if (config.mcPaths < 100) {
    errors.push({
      code: 'TOO_FEW_PATHS',
      severity: 'WARNING',
      field: 'mcPaths',
      message: `${config.mcPaths} simulations Monte Carlo — les résultats seront peu fiables.`,
      suggestedFix: 'Minimum recommandé : 1 000. Optimal : 10 000-50 000.',
    });
  }

  if (config.mcPaths > 100000) {
    errors.push({
      code: 'TOO_MANY_PATHS',
      severity: 'INFO',
      field: 'mcPaths',
      message: `${config.mcPaths} simulations — le temps de calcul sera élevé.`,
    });
  }

  // ── Structure-specific validations ────────────────────────────────────────
  validateStructureSpecific(config, errors);

  return errors;
}

function validateStructureSpecific(
  config: StructuredProductConfig,
  errors: ValidationError[],
): void {
  const { structureType, payoff } = config;

  switch (structureType) {
    case 'AUTOCALL':
    case 'PHOENIX_AUTOCALL':
    case 'COUPON_EXPRESS':
      if (!payoff.autocallEnabled) {
        errors.push({
          code: 'AUTOCALL_NOT_ENABLED',
          severity: 'ERROR',
          field: 'payoff.autocallEnabled',
          message: `Un produit ${structureType} nécessite l'activation de l'autocall.`,
        });
      }
      if (payoff.couponType === 'NONE') {
        errors.push({
          code: 'NO_COUPON_ON_PHOENIX',
          severity: 'WARNING',
          field: 'payoff.couponType',
          message: 'Un Phoenix sans coupon n\'a pas de sens commercial.',
        });
      }
      break;

    case 'CAPITAL_PROTECTED_NOTE':
      if (payoff.capitalGuaranteeLevel < 0.9) {
        errors.push({
          code: 'LOW_PROTECTION_ON_CPN',
          severity: 'ERROR',
          field: 'payoff.capitalGuaranteeLevel',
          message: 'Un Capital Protégé doit avoir au minimum 90% de garantie du capital.',
          suggestedFix: 'Augmenter le niveau de garantie ou changer de structure.',
        });
      }
      break;

    case 'REVERSE_CONVERTIBLE':
    case 'BARRIER_REVERSE_CONVERTIBLE':
      if (payoff.protectionType !== 'BARRIER') {
        errors.push({
          code: 'RC_NEEDS_BARRIER',
          severity: 'WARNING',
          field: 'payoff.protectionType',
          message: 'Un Reverse Convertible a typiquement une protection par barrière.',
        });
      }
      break;

    case 'CAPPED_PARTICIPATION':
      if (payoff.cap <= 0) {
        errors.push({
          code: 'CAPPED_WITHOUT_CAP',
          severity: 'ERROR',
          field: 'payoff.cap',
          message: 'Un produit Capped Participation nécessite un cap (plafond) défini.',
        });
      }
      break;

    case 'MEMORY_COUPON':
      if (payoff.couponType !== 'MEMORY') {
        errors.push({
          code: 'MEMORY_COUPON_TYPE',
          severity: 'ERROR',
          field: 'payoff.couponType',
          message: 'Un Memory Coupon nécessite un coupon de type MEMORY.',
        });
      }
      break;
  }
}

/**
 * Quick check — returns true if config has no ERROR-level issues.
 */
export function isValidConfig(config: StructuredProductConfig): boolean {
  const errors = validateProductConfig(config);
  return !errors.some((e) => e.severity === 'ERROR');
}
