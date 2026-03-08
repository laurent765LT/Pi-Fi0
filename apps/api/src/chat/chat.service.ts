import { Injectable, Logger } from '@nestjs/common';
import { PayoffType, ProductStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

type Product = Prisma.ProductGetPayload<Record<string, never>>;

interface ParsedFilters {
  payoffTypes: PayoffType[];
  sriMax?: number;
  sriMin?: number;
  keywords: string[];
  hasCapitalProtection: boolean;
  lookingForRate: boolean;
}

export interface ChatResponse {
  reply: string;
  products: Product[];
}

const KEYWORD_MAP: Record<string, Partial<ParsedFilters>> = {
  sri: {},
  phoenix: { payoffTypes: [PayoffType.AUTOCALL_PHOENIX] },
  autocall: { payoffTypes: [PayoffType.AUTOCALL_PHOENIX, PayoffType.AUTOCALL_COUPON] },
  'protégé': { hasCapitalProtection: true },
  protege: { hasCapitalProtection: true },
  protection: { hasCapitalProtection: true },
  capital: { hasCapitalProtection: true },
  taux: { lookingForRate: true },
  rate: { lookingForRate: true },
  coupon: { payoffTypes: [PayoffType.AUTOCALL_COUPON] },
  or: { keywords: ['or', 'gold'] },
  gold: { keywords: ['gold', 'or'] },
  europe: { keywords: ['europe', 'eurostoxx', 'cac'] },
  eurostoxx: { keywords: ['eurostoxx'] },
  cac: { keywords: ['cac'] },
  barriere: { payoffTypes: [PayoffType.BARRIER_NOTE] },
  barrier: { payoffTypes: [PayoffType.BARRIER_NOTE] },
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processMessage(message: string, userId: string): Promise<ChatResponse> {
    this.logger.log(`Processing chat message for user ${userId}: "${message}"`);

    const filters = this.parseFilters(message);
    const products = await this.queryProducts(filters);
    const reply = this.buildReply(message, filters, products);

    return { reply, products };
  }

  private parseFilters(message: string): ParsedFilters {
    const normalized = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const filters: ParsedFilters = {
      payoffTypes: [],
      keywords: [],
      hasCapitalProtection: false,
      lookingForRate: false,
    };

    // SRI extraction: look for "sri 3", "sri3", "risque 3", etc.
    const sriMatch = normalized.match(/(?:sri|risque)\s*([1-7])/);
    if (sriMatch) {
      const sriValue = parseInt(sriMatch[1] ?? '', 10);
      filters.sriMin = sriValue;
      filters.sriMax = sriValue;
    }

    // SRI range: "faible risque" -> sri 1-3, "risque élevé" -> sri 5-7
    if (/faible\s*risque|low\s*risk|conservat/.test(normalized)) {
      filters.sriMax = 3;
    } else if (/(?:risque\s*(?:élevé|eleve|fort|haut)|high\s*risk)/.test(normalized)) {
      filters.sriMin = 5;
    }

    // Match keywords
    for (const [keyword, partialFilters] of Object.entries(KEYWORD_MAP)) {
      if (normalized.includes(keyword)) {
        if (partialFilters.payoffTypes?.length) {
          filters.payoffTypes.push(...partialFilters.payoffTypes);
        }
        if (partialFilters.keywords?.length) {
          filters.keywords.push(...partialFilters.keywords);
        }
        if (partialFilters.hasCapitalProtection) {
          filters.hasCapitalProtection = true;
        }
        if (partialFilters.lookingForRate) {
          filters.lookingForRate = true;
        }
      }
    }

    // De-duplicate
    filters.payoffTypes = [...new Set(filters.payoffTypes)];
    filters.keywords = [...new Set(filters.keywords)];

    // If asking for rate/taux and no payoff type yet, include conditional rate
    if (filters.lookingForRate && filters.payoffTypes.length === 0) {
      filters.payoffTypes.push(PayoffType.CONDITIONAL_RATE);
    }

    // Capital protection implies CAPITAL_PROTECTED
    if (filters.hasCapitalProtection) {
      filters.payoffTypes.push(PayoffType.CAPITAL_PROTECTED);
      filters.payoffTypes = [...new Set(filters.payoffTypes)];
    }

    return filters;
  }

  private async queryProducts(filters: ParsedFilters): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
    };

    if (filters.payoffTypes.length > 0) {
      where.payoffType = { in: filters.payoffTypes };
    }

    if (filters.sriMin !== undefined || filters.sriMax !== undefined) {
      where.sri = {};
      if (filters.sriMin !== undefined) {
        (where.sri as Prisma.IntFilter).gte = filters.sriMin;
      }
      if (filters.sriMax !== undefined) {
        (where.sri as Prisma.IntFilter).lte = filters.sriMax;
      }
    }

    if (filters.keywords.length > 0) {
      const keywordConditions: Prisma.ProductWhereInput[] = filters.keywords.map((kw) => ({
        OR: [
          { name: { contains: kw, mode: 'insensitive' } },
          { underlyingName: { contains: kw, mode: 'insensitive' } },
          { description: { contains: kw, mode: 'insensitive' } },
        ],
      }));

      where.AND = keywordConditions;
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  private buildReply(
    message: string,
    filters: ParsedFilters,
    products: Product[],
  ): string {
    if (products.length === 0) {
      return `Je n'ai trouvé aucun produit correspondant à votre recherche "${message}". Essayez des termes comme "phoenix", "protégé", "SRI 3", ou "europe".`;
    }

    const parts: string[] = [];

    if (filters.payoffTypes.length > 0) {
      const typeLabels = filters.payoffTypes.map((t) => t.toLowerCase().replace(/_/g, ' '));
      parts.push(`produits de type ${typeLabels.join(', ')}`);
    }

    if (filters.sriMin !== undefined || filters.sriMax !== undefined) {
      if (filters.sriMin === filters.sriMax && filters.sriMin !== undefined) {
        parts.push(`SRI ${filters.sriMin}`);
      } else if (filters.sriMax !== undefined && filters.sriMin === undefined) {
        parts.push(`SRI jusqu'à ${filters.sriMax}`);
      } else if (filters.sriMin !== undefined && filters.sriMax === undefined) {
        parts.push(`SRI à partir de ${filters.sriMin}`);
      } else {
        parts.push(`SRI entre ${filters.sriMin} et ${filters.sriMax}`);
      }
    }

    if (filters.keywords.length > 0) {
      parts.push(`sous-jacent "${filters.keywords.join('", "')}"`);
    }

    const criteriaText = parts.length > 0 ? ` (${parts.join(', ')})` : '';

    return `J'ai trouvé ${products.length} produit${products.length > 1 ? 's' : ''}${criteriaText} correspondant à votre recherche.`;
  }
}
