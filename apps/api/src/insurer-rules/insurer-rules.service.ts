import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export interface ProductEligibility {
  productId: string;
  productName: string;
  isEligible: boolean;
  failedRules: Array<{ ruleName: string; reason: string }>;
  passedRules: string[];
}

@Injectable()
export class InsurerRulesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Rules CRUD ─────────────────────────────────────────────────────────────

  async createRule(dto: {
    orgId: string;
    ruleName: string;
    allowedPayoffTypes?: string[];
    allowedIssuers?: string[];
    maxSri?: number;
    minBarrierPct?: number;
    maxMaturityMonths?: number;
    maxEntryFeePct?: number;
    maxManagementFeePct?: number;
    minNominal?: number;
    allowedCurrencies?: string[];
    customRules?: any;
    priority?: number;
  }) {
    return this.prisma.insurerRule.create({
      data: {
        orgId: dto.orgId,
        ruleName: dto.ruleName,
        allowedPayoffTypes: dto.allowedPayoffTypes ?? [],
        allowedIssuers: dto.allowedIssuers ?? [],
        maxSri: dto.maxSri,
        minBarrierPct: dto.minBarrierPct,
        maxMaturityMonths: dto.maxMaturityMonths,
        maxEntryFeePct: dto.maxEntryFeePct,
        maxManagementFeePct: dto.maxManagementFeePct,
        minNominal: dto.minNominal,
        allowedCurrencies: dto.allowedCurrencies ?? ['EUR'],
        customRules: dto.customRules,
        priority: dto.priority ?? 0,
      },
    });
  }

  async listRules(orgId: string) {
    return this.prisma.insurerRule.findMany({
      where: { orgId, isActive: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: { organization: { select: { name: true } } },
    });
  }

  async updateRule(id: string, dto: any) {
    return this.prisma.insurerRule.update({
      where: { id },
      data: dto,
    });
  }

  async deleteRule(id: string) {
    return this.prisma.insurerRule.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── Product Eligibility Check ──────────────────────────────────────────────

  async checkProductEligibility(orgId: string, productId: string): Promise<ProductEligibility> {
    const [product, rules] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: productId } }),
      this.prisma.insurerRule.findMany({
        where: { orgId, isActive: true },
        orderBy: { priority: 'desc' },
      }),
    ]);

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const failedRules: Array<{ ruleName: string; reason: string }> = [];
    const passedRules: string[] = [];

    for (const rule of rules) {
      const failures: string[] = [];

      // Check payoff type
      if (rule.allowedPayoffTypes.length > 0 && !rule.allowedPayoffTypes.includes(product.payoffType)) {
        failures.push(`Type de payoff ${product.payoffType} non autorise`);
      }

      // Check issuer
      if (rule.allowedIssuers.length > 0 && !rule.allowedIssuers.includes(product.issuerName)) {
        failures.push(`Emetteur ${product.issuerName} non autorise`);
      }

      // Check SRI
      if (rule.maxSri != null && product.sri > rule.maxSri) {
        failures.push(`SRI ${product.sri} depasse le maximum ${rule.maxSri}`);
      }

      // Check barrier
      if (rule.minBarrierPct != null && product.barrierCapPct < rule.minBarrierPct) {
        failures.push(`Barriere ${product.barrierCapPct}% inferieure au minimum ${rule.minBarrierPct}%`);
      }

      // Check maturity
      if (rule.maxMaturityMonths != null) {
        const monthsToMaturity = Math.ceil(
          (product.maturityDate.getTime() - Date.now()) / (30.44 * 24 * 3600 * 1000),
        );
        if (monthsToMaturity > rule.maxMaturityMonths) {
          failures.push(`Maturite ${monthsToMaturity}m depasse le maximum ${rule.maxMaturityMonths}m`);
        }
      }

      // Check entry fee
      if (rule.maxEntryFeePct != null && product.entryFeePct > rule.maxEntryFeePct) {
        failures.push(`Frais d'entree ${product.entryFeePct}% depassent le maximum ${rule.maxEntryFeePct}%`);
      }

      // Check management fee
      if (rule.maxManagementFeePct != null && product.managementFeePct > rule.maxManagementFeePct) {
        failures.push(`Frais de gestion ${product.managementFeePct}% depassent le maximum ${rule.maxManagementFeePct}%`);
      }

      if (failures.length > 0) {
        failedRules.push({ ruleName: rule.ruleName, reason: failures.join('; ') });
      } else {
        passedRules.push(rule.ruleName);
      }
    }

    return {
      productId: product.id,
      productName: product.name,
      isEligible: failedRules.length === 0,
      failedRules,
      passedRules,
    };
  }

  // ── Batch eligibility check ────────────────────────────────────────────────

  async filterEligibleProducts(orgId: string, productIds?: string[]): Promise<{
    eligible: string[];
    ineligible: Array<{ productId: string; reasons: string[] }>;
  }> {
    const where = productIds ? { id: { in: productIds } } : {};
    const products = await this.prisma.product.findMany({ where, select: { id: true } });

    const results = await Promise.all(
      products.map((p) => this.checkProductEligibility(orgId, p.id)),
    );

    const eligible = results.filter((r) => r.isEligible).map((r) => r.productId);
    const ineligible = results
      .filter((r) => !r.isEligible)
      .map((r) => ({
        productId: r.productId,
        reasons: r.failedRules.map((f) => `${f.ruleName}: ${f.reason}`),
      }));

    return { eligible, ineligible };
  }
}
