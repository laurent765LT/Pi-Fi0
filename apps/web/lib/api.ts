import {
  DEMO_PRODUCTS,
  DEMO_COMMITMENTS,
  DEMO_RECOMMENDATIONS,
  DEMO_FAVORITES,
  DEMO_RECENT_VIEWS,
  DEMO_COMMISSION_SUMMARY,
} from './demo-data';
import { simulatePricing } from './pricing-simulator';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  /** Check if we're running in demo mode (no backend). */
  private get isDemo(): boolean {
    return this.token !== null && this.token.startsWith('demo-token-');
  }

  /**
   * Wraps an API call so that if we're in demo mode (or the real
   * call fails with a network error) we return a fallback value.
   */
  private async withDemoFallback<T>(
    realCall: () => Promise<T>,
    demoFallback: () => T,
  ): Promise<T> {
    if (this.isDemo) return demoFallback();
    try {
      return await realCall();
    } catch {
      // If the API is unreachable, fall back to demo data
      return demoFallback();
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Erreur réseau' }));
      throw new Error(error.message ?? `Erreur ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  // ── Auth ────────────────────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      return await this.request<{
        accessToken: string;
        refreshToken: string;
        user: any;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async refresh(refreshToken: string) {
    return this.request<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken }) },
    );
  }

  async getMe() {
    return this.withDemoFallback(
      () => this.request<any>('/auth/me'),
      () => null,
    );
  }

  // ── Products ────────────────────────────────────────────────────────────────

  async getProducts(params?: Record<string, string>) {
    return this.withDemoFallback(
      () => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return this.request<{ data: any[]; meta: any }>(`/products${qs}`);
      },
      () => {
        let filtered = [...DEMO_PRODUCTS];
        if (params?.search) {
          const q = params.search.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.isin.toLowerCase().includes(q) ||
              p.underlyingName.toLowerCase().includes(q),
          );
        }
        if (params?.payoffType) {
          filtered = filtered.filter((p) => p.payoffType === params.payoffType);
        }
        return { data: filtered, meta: { total: filtered.length, page: 1, limit: 50 } };
      },
    );
  }

  async getProduct(id: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/products/${id}`),
      () => DEMO_PRODUCTS.find((p) => p.id === id) ?? DEMO_PRODUCTS[0],
    );
  }

  async getProductPayoff(id: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/products/${id}/payoff`),
      () => {
        // Build demo PayoffScenario[] with { name, color, data: [{date,value}] } format
        const now = new Date();
        const dates: string[] = [];
        for (let i = 0; i < 24; i++) {
          const d = new Date(now);
          d.setMonth(d.getMonth() + i);
          dates.push(d.toISOString().slice(0, 10));
        }
        const base = 100_000;
        return {
          best: dates.map((date, i) => ({ date, value: Math.round(base * (1 + 0.07 * (i / 12))) })),
          base: dates.map((date, i) => ({ date, value: Math.round(base * (1 + 0.03 * (i / 12))) })),
          worst: dates.map((date, i) => ({ date, value: Math.round(base * (1 - 0.02 * (i / 12) - (i > 18 ? 0.3 : 0))) })),
        };
      },
    );
  }

  // ── Shelves ─────────────────────────────────────────────────────────────────

  async getShelves() {
    return this.withDemoFallback(
      () => this.request<any[]>('/shelves'),
      () =>
        DEMO_PRODUCTS.slice(0, 6).map((p) => ({
          id: `shelf-${p.id}`,
          productId: p.id,
          product: p,
          targetAmount: p.targetAmount,
          filledAmount: Math.round(p.targetAmount * (p.fillPct / 100)),
          status: 'OPEN',
        })),
    );
  }

  async getShelf(id: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/shelves/${id}`),
      () => {
        const p = DEMO_PRODUCTS[0];
        return {
          id,
          productId: p.id,
          product: p,
          targetAmount: p.targetAmount,
          filledAmount: Math.round(p.targetAmount * (p.fillPct / 100)),
          status: 'OPEN',
        };
      },
    );
  }

  // ── Commitments ─────────────────────────────────────────────────────────────

  async createCommitment(shelfId: string, amount: number) {
    return this.withDemoFallback(
      () =>
        this.request<any>('/commitments', {
          method: 'POST',
          body: JSON.stringify({ shelfId, amount }),
        }),
      () => ({
        id: 'demo-commit-' + Date.now(),
        shelfId,
        amount,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }),
    );
  }

  async getMyCommitments() {
    return this.withDemoFallback(
      () => this.request<any[]>('/commitments'),
      () => DEMO_COMMITMENTS,
    );
  }

  async cancelCommitment(id: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/commitments/${id}`, { method: 'DELETE' }),
      () => ({ id, status: 'CANCELLED' }),
    );
  }

  async reviewCommitment(id: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/commitments/${id}/review`, { method: 'PATCH' }),
      () => ({ id, status: 'REVIEW' }),
    );
  }

  async approveCommitment(id: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/commitments/${id}/approve`, { method: 'PATCH' }),
      () => ({ id, status: 'CONFIRMED' }),
    );
  }

  async rejectCommitment(id: string, reason: string) {
    return this.withDemoFallback(
      () =>
        this.request<any>(`/commitments/${id}/reject`, {
          method: 'PATCH',
          body: JSON.stringify({ reason }),
        }),
      () => ({ id, status: 'CANCELLED', rejectionReason: reason }),
    );
  }

  // ── Market - Quotes & History ───────────────────────────────────────────────

  async getQuote(symbol: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/market/quote/${encodeURIComponent(symbol)}`),
      () => ({
        symbol,
        price: 4850 + Math.random() * 200,
        change: (Math.random() - 0.5) * 50,
        changePct: (Math.random() - 0.5) * 2,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  async getEuribor() {
    return this.withDemoFallback(
      () => this.request<any>('/market/euribor'),
      () => ({ rate: 2.85, date: '2026-03-07', term: '12M' }),
    );
  }

  async getHistory(symbol: string) {
    return this.withDemoFallback(
      () => this.request<any[]>(`/market/history/${encodeURIComponent(symbol)}`),
      () => {
        const points = [];
        let price = 4500;
        for (let i = 90; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          price += (Math.random() - 0.48) * 30;
          points.push({ date: d.toISOString().slice(0, 10), close: Math.round(price * 100) / 100 });
        }
        return points;
      },
    );
  }

  // ── Market - Alpha Vantage ──────────────────────────────────────────────────

  async getCompanyOverview(symbol: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/market/overview/${encodeURIComponent(symbol)}`),
      () => ({
        symbol,
        name: symbol,
        sector: 'Technology',
        marketCap: '2.5T',
        peRatio: 28.5,
        beta: 1.2,
        dividendYield: '0.55%',
      }),
    );
  }

  async searchSymbol(query: string) {
    return this.withDemoFallback(
      () => this.request<any[]>(`/market/search?q=${encodeURIComponent(query)}`),
      () => [
        { symbol: '^STOXX50E', name: 'Euro Stoxx 50', type: 'Index' },
        { symbol: 'AAPL', name: 'Apple Inc', type: 'Equity' },
      ],
    );
  }

  async getIntraday(symbol: string, interval: string = '5min') {
    return this.withDemoFallback(
      () => this.request<any[]>(`/market/intraday/${encodeURIComponent(symbol)}?interval=${interval}`),
      () => [],
    );
  }

  async getForexRate(from: string, to: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/market/forex/${from}/${to}`),
      () => ({ from, to, rate: 1.08, timestamp: new Date().toISOString() }),
    );
  }

  // ── AI (Perplexity) ─────────────────────────────────────────────────────────

  async getAiStatus() {
    return this.withDemoFallback(
      () => this.request<{ perplexity: boolean; features: Record<string, boolean> }>('/ai/status'),
      () => ({
        perplexity: false,
        features: { chat: false, analysis: false, sentiment: false, risk: false },
      }),
    );
  }

  async aiChat(message: string, context?: { productNames?: string[]; productTypes?: string[] }) {
    return this.withDemoFallback(
      () =>
        this.request<{ content: string; citations: string[]; model: string; tokensUsed: number }>('/ai/chat', {
          method: 'POST',
          body: JSON.stringify({ message, context }),
        }),
      () => ({
        content: 'Mode démo : l\'IA n\'est pas disponible sans connexion au backend. Déployez l\'API pour activer les fonctionnalités IA.',
        citations: [],
        model: 'demo',
        tokensUsed: 0,
      }),
    );
  }

  async analyzeUnderlying(ticker: string, name?: string) {
    return this.withDemoFallback(
      () => {
        const params = name ? `?name=${encodeURIComponent(name)}` : '';
        return this.request<{ content: string; citations: string[]; model: string; tokensUsed: number }>(
          `/ai/analyze/${encodeURIComponent(ticker)}${params}`,
        );
      },
      () => ({
        content: `Mode démo : analyse de ${ticker} non disponible.`,
        citations: [],
        model: 'demo',
        tokensUsed: 0,
      }),
    );
  }

  async getMarketSentiment(topic?: string) {
    return this.withDemoFallback(
      () => {
        const params = topic ? `?topic=${encodeURIComponent(topic)}` : '';
        return this.request<{ content: string; citations: string[]; model: string; tokensUsed: number }>(
          `/ai/sentiment${params}`,
        );
      },
      () => ({
        content: 'Mode démo : sentiment de marché non disponible.',
        citations: [],
        model: 'demo',
        tokensUsed: 0,
      }),
    );
  }

  async assessProductRisk(product: {
    name: string;
    payoffType: string;
    underlyingName: string;
    underlyingTicker: string;
    barrierPct: number | null;
    couponPct: number | null;
    maturityDate: string;
    sri: number;
  }) {
    return this.withDemoFallback(
      () =>
        this.request<{ content: string; citations: string[]; model: string; tokensUsed: number }>(
          '/ai/risk-assessment',
          { method: 'POST', body: JSON.stringify(product) },
        ),
      () => ({
        content: `Mode démo : évaluation de risque pour "${product.name}" non disponible.`,
        citations: [],
        model: 'demo',
        tokensUsed: 0,
      }),
    );
  }

  // ── Onboarding ──────────────────────────────────────────────────────────────

  async uploadOrias(oriasNumber: string) {
    return this.withDemoFallback(
      () =>
        this.request<any>('/onboarding/upload-orias', {
          method: 'POST',
          body: JSON.stringify({ oriasNumber }),
        }),
      () => ({ status: 'ok', oriasNumber }),
    );
  }

  async uploadRcp(rcpInsurer: string, rcpAmount: number) {
    return this.withDemoFallback(
      () =>
        this.request<any>('/onboarding/upload-rcp', {
          method: 'POST',
          body: JSON.stringify({ rcpInsurer, rcpAmount }),
        }),
      () => ({ status: 'ok', rcpInsurer, rcpAmount }),
    );
  }

  async completeOnboarding() {
    return this.withDemoFallback(
      () => this.request<any>('/onboarding/complete', { method: 'POST' }),
      () => ({ status: 'completed' }),
    );
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  async getAdminStats() {
    return this.withDemoFallback(
      () => this.request<any>('/admin/stats'),
      () => ({
        totalUsers: 3,
        totalProducts: DEMO_PRODUCTS.length,
        totalCommitments: DEMO_COMMITMENTS.length,
        totalVolume: DEMO_COMMITMENTS.reduce((acc, c) => acc + c.amount, 0),
        activeOrgs: 3,
      }),
    );
  }

  // ── Chat ────────────────────────────────────────────────────────────────────

  async chat(message: string) {
    return this.withDemoFallback(
      () =>
        this.request<{ reply: string; products: any[] }>('/chat', {
          method: 'POST',
          body: JSON.stringify({ message }),
        }),
      () => ({
        reply: 'Mode démo — le chatbot n\'est pas disponible sans backend. Parcourez le catalogue pour découvrir nos produits structurés.',
        products: DEMO_PRODUCTS.slice(0, 3),
      }),
    );
  }

  // ── Pricing Engine ──────────────────────────────────────────────────────────

  async priceProduct(config: any, saveRun: boolean = true) {
    return this.withDemoFallback(
      () =>
        this.request<{ result: any; validation: any[]; runId?: string }>('/pricing/price', {
          method: 'POST',
          body: JSON.stringify({ config, saveRun }),
        }),
      () => {
        const result = simulatePricing(config ?? {});
        return {
          result,
          validation: [
            { severity: 'WARNING', message: 'Pricing simulé en mode démo — résultats indicatifs uniquement' },
          ],
          runId: 'demo-run-' + Date.now(),
        };
      },
    );
  }

  async validatePricingConfig(config: any) {
    return this.withDemoFallback(
      () =>
        this.request<{ valid: boolean; errors: any[] }>('/pricing/validate', {
          method: 'POST',
          body: JSON.stringify({ config }),
        }),
      () => ({ valid: true, errors: [] }),
    );
  }

  async runScenarios(config: any, shocks?: number[]) {
    return this.withDemoFallback(
      () =>
        this.request<{ scenarios: Array<{ shock: number; result: any }> }>('/pricing/scenarios', {
          method: 'POST',
          body: JSON.stringify({ config, shocks }),
        }),
      () => ({
        scenarios: (shocks ?? [-20, -10, 0, 10, 20]).map((s) => ({
          shock: s,
          result: { fairValue: 97.5 + s * 0.3, clientPrice: 100 + s * 0.25 },
        })),
      }),
    );
  }

  async getPricingHistory(limit?: number, offset?: number) {
    return this.withDemoFallback(
      () => {
        const params = new URLSearchParams();
        if (limit) params.set('limit', String(limit));
        if (offset) params.set('offset', String(offset));
        const qs = params.toString();
        return this.request<{ runs: any[]; total: number }>(`/pricing/history${qs ? '?' + qs : ''}`);
      },
      () => ({ runs: [], total: 0 }),
    );
  }

  async getPricingRun(id: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/pricing/runs/${id}`),
      () => ({ id, config: {}, result: {}, createdAt: new Date().toISOString() }),
    );
  }

  async getProductTemplates() {
    return this.withDemoFallback(
      () => this.request<any[]>('/pricing/templates'),
      () => [
        {
          id: 'tpl-1', name: 'Autocall Phoenix — Euro Stoxx 50', structureType: 'PHOENIX_AUTOCALL',
          config: {
            structureType: 'PHOENIX_AUTOCALL', currency: 'EUR', nominalAmount: 1_000_000,
            payoff: { couponType: 'CONDITIONAL', couponRate: 0.08, couponBarrier: 0.60, couponMemory: true, autocallEnabled: true, autocallBarrier: 1.0, protectionBarrier: 0.60, barrierMonitoring: 'EUROPEAN', cap: 0, participationUp: 1.0 },
            market: { riskFreeRate: 0.03, fundingSpread: 0.005, structuringMargin: 0.015, distributionFee: 0.02 },
            mcPaths: 10000,
          },
        },
        {
          id: 'tpl-2', name: 'Capital Protégé — Or', structureType: 'CAPITAL_PROTECTED_NOTE',
          config: {
            structureType: 'CAPITAL_PROTECTED_NOTE', currency: 'EUR', nominalAmount: 500_000,
            payoff: { couponType: 'NONE', couponRate: 0, couponBarrier: 0, couponMemory: false, autocallEnabled: false, autocallBarrier: 1.0, protectionBarrier: 0.90, barrierMonitoring: 'EUROPEAN', cap: 0.50, participationUp: 1.0 },
            market: { riskFreeRate: 0.03, fundingSpread: 0.005, structuringMargin: 0.01, distributionFee: 0.015 },
            mcPaths: 10000,
          },
        },
        {
          id: 'tpl-3', name: 'Reverse Convertible — BNP Paribas', structureType: 'REVERSE_CONVERTIBLE',
          config: {
            structureType: 'REVERSE_CONVERTIBLE', currency: 'EUR', nominalAmount: 500_000,
            payoff: { couponType: 'FIXED', couponRate: 0.10, couponBarrier: 0, couponMemory: false, autocallEnabled: false, autocallBarrier: 1.0, protectionBarrier: 0.70, barrierMonitoring: 'CONTINUOUS', cap: 0, participationUp: 1.0 },
            market: { riskFreeRate: 0.03, fundingSpread: 0.005, structuringMargin: 0.02, distributionFee: 0.02 },
            mcPaths: 10000,
          },
        },
      ],
    );
  }

  async getProductTemplate(id: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/pricing/templates/${id}`),
      () => ({ id, name: 'Template Demo', structureType: 'AUTOCALL_PHOENIX', config: {} }),
    );
  }

  async createProductTemplate(data: { name: string; description?: string; structureType: string; config: any }) {
    return this.withDemoFallback(
      () =>
        this.request<any>('/pricing/templates', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      () => ({ id: 'demo-tpl-' + Date.now(), ...data }),
    );
  }

  // ── RFQ Simulator ───────────────────────────────────────────────────────────

  async createRfq(data: any) {
    return this.withDemoFallback(
      () =>
        this.request<any>('/rfq', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      () => ({ id: 'demo-rfq-' + Date.now(), ...data, status: 'DRAFT' }),
    );
  }

  async sendRfq(rfqId: string) {
    return this.withDemoFallback(
      () => this.request<{ rfq: any; quotes: any[] }>(`/rfq/${rfqId}/send`, { method: 'POST' }),
      () => {
        const base = 97.5 + Math.random() * 2;
        return {
          rfq: { id: rfqId, status: 'SENT', sentAt: new Date().toISOString() },
          quotes: [
            { id: 'q1', issuerName: 'BNP Paribas Issuance', price: +(base + 1.2 + Math.random() * 0.8).toFixed(2), spread: 0.8, indicative: true, receivedAt: new Date().toISOString() },
            { id: 'q2', issuerName: 'SG Issuer', price: +(base + 0.8 + Math.random() * 0.6).toFixed(2), spread: 0.9, indicative: true, receivedAt: new Date().toISOString() },
            { id: 'q3', issuerName: 'Natixis Structured Issuance', price: +(base + 1.5 + Math.random() * 0.5).toFixed(2), spread: 0.7, indicative: true, receivedAt: new Date().toISOString() },
            { id: 'q4', issuerName: 'Goldman Sachs International', price: +(base + 0.5 + Math.random() * 1.0).toFixed(2), spread: 1.1, indicative: true, receivedAt: new Date().toISOString() },
            { id: 'q5', issuerName: 'Barclays Capital', price: +(base + 0.9 + Math.random() * 0.7).toFixed(2), spread: 1.0, indicative: true, receivedAt: new Date().toISOString() },
          ],
        };
      },
    );
  }

  async getRfq(rfqId: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/rfq/${rfqId}`),
      () => ({ id: rfqId, status: 'DRAFT', createdAt: new Date().toISOString() }),
    );
  }

  async listRfqs(opts?: { limit?: number; offset?: number; status?: string }) {
    return this.withDemoFallback(
      () => {
        const params = new URLSearchParams();
        if (opts?.limit) params.set('limit', String(opts.limit));
        if (opts?.offset) params.set('offset', String(opts.offset));
        if (opts?.status) params.set('status', opts.status);
        const qs = params.toString();
        return this.request<{ rfqs: any[]; total: number }>(`/rfq${qs ? '?' + qs : ''}`);
      },
      () => ({ rfqs: [], total: 0 }),
    );
  }

  async selectRfqQuote(rfqId: string, quoteId: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/rfq/${rfqId}/select/${quoteId}`, { method: 'POST' }),
      () => ({ rfqId, selectedQuoteId: quoteId, status: 'QUOTE_SELECTED' }),
    );
  }

  async getRfqIssuers() {
    return this.withDemoFallback(
      () => this.request<any[]>('/rfq/issuers/all'),
      () => [
        { id: 'iss-1', name: 'BNP Paribas Issuance B.V.' },
        { id: 'iss-2', name: 'SG Issuer' },
        { id: 'iss-3', name: 'Julius Baer' },
        { id: 'iss-4', name: 'Natixis Structured Issuance' },
        { id: 'iss-5', name: 'Marex Financial Products' },
      ],
    );
  }

  // ── Favorites & Views ───────────────────────────────────────────────────────

  async toggleFavorite(userId: string, productId: string) {
    return this.withDemoFallback(
      () => this.request<{ isFavorite: boolean }>(`/favorites/toggle/${userId}/${productId}`, { method: 'POST' }),
      () => ({ isFavorite: true }),
    );
  }

  async getUserFavorites(userId: string) {
    return this.withDemoFallback(
      () => this.request<any[]>(`/favorites/user/${userId}`),
      () => DEMO_FAVORITES.map((f) => ({ ...f, userId })),
    );
  }

  async checkFavorite(userId: string, productId: string) {
    return this.withDemoFallback(
      () => this.request<boolean>(`/favorites/check/${userId}/${productId}`),
      () => DEMO_FAVORITES.some((f) => f.productId === productId),
    );
  }

  async trackProductView(userId: string, productId: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/favorites/view/${userId}/${productId}`, { method: 'POST' }),
      () => ({ userId, productId, viewedAt: new Date().toISOString() }),
    );
  }

  async getRecentViews(userId: string, limit?: number) {
    return this.withDemoFallback(
      () => {
        const qs = limit ? `?limit=${limit}` : '';
        return this.request<any[]>(`/favorites/recent/${userId}${qs}`);
      },
      () => DEMO_RECENT_VIEWS.slice(0, limit ?? 10),
    );
  }

  async getMostViewedProducts(limit?: number) {
    return this.withDemoFallback(
      () => {
        const qs = limit ? `?limit=${limit}` : '';
        return this.request<any[]>(`/favorites/most-viewed${qs}`);
      },
      () =>
        DEMO_PRODUCTS.sort((a, b) => b.fillPct - a.fillPct)
          .slice(0, limit ?? 10)
          .map((p) => ({ product: p, viewCount: Math.round(p.fillPct * 1.5) })),
    );
  }

  // ── AI Recommendations ──────────────────────────────────────────────────────

  async generateRecommendations(userId: string) {
    return this.withDemoFallback(
      () => this.request<any[]>(`/recommendations/generate/${userId}`, { method: 'POST' }),
      () => DEMO_RECOMMENDATIONS,
    );
  }

  async getRecommendations(userId: string) {
    return this.withDemoFallback(
      () => this.request<any[]>(`/recommendations/${userId}`),
      () => DEMO_RECOMMENDATIONS,
    );
  }

  async dismissRecommendation(userId: string, productId: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/recommendations/dismiss/${userId}/${productId}`, { method: 'POST' }),
      () => ({ dismissed: true }),
    );
  }

  // ── Commissions ─────────────────────────────────────────────────────────────

  async getCommissionSummary(orgId?: string) {
    return this.withDemoFallback(
      () => {
        const qs = orgId ? `?orgId=${orgId}` : '';
        return this.request<any>(`/commissions/summary${qs}`);
      },
      () => DEMO_COMMISSION_SUMMARY,
    );
  }

  async getCommissionRules(orgId?: string) {
    return this.withDemoFallback(
      () => {
        const qs = orgId ? `?orgId=${orgId}` : '';
        return this.request<any[]>(`/commissions/rules${qs}`);
      },
      () => [
        { id: 'cr-1', commissionType: 'ENTRY_FEE', ratePct: 5.0, splitPlatformPct: 30, splitDistributorPct: 70 },
        { id: 'cr-2', commissionType: 'MANAGEMENT_FEE', ratePct: 1.0, splitPlatformPct: 40, splitDistributorPct: 60 },
        { id: 'cr-3', commissionType: 'DISTRIBUTION_FEE', ratePct: 2.0, splitPlatformPct: 25, splitDistributorPct: 75 },
      ],
    );
  }

  async getOrgCommissions(orgId: string) {
    return this.withDemoFallback(
      () => this.request<any[]>(`/commissions/org/${orgId}`),
      () => [],
    );
  }

  // ── Insurer Rules ───────────────────────────────────────────────────────────

  async getInsurerRules(orgId: string) {
    return this.withDemoFallback(
      () => this.request<any[]>(`/insurer-rules/${orgId}`),
      () => [
        {
          id: 'ir-1',
          orgId,
          ruleName: 'Règle par défaut',
          allowedPayoffTypes: ['AUTOCALL_PHOENIX', 'CAPITAL_PROTECTED'],
          maxSri: 6,
          minBarrierPct: 50,
        },
      ],
    );
  }

  async checkProductEligibility(orgId: string, productId: string) {
    return this.withDemoFallback(
      () => this.request<any>(`/insurer-rules/check/${orgId}/${productId}`),
      () => ({ eligible: true, reasons: [] }),
    );
  }

  // ── Activity ────────────────────────────────────────────────────────────────

  async getUserActivity(userId: string, limit?: number) {
    return this.withDemoFallback(
      () => {
        const qs = limit ? `?limit=${limit}` : '';
        return this.request<any[]>(`/activity/user/${userId}${qs}`);
      },
      () => [
        { id: 'a1', action: 'LOGIN', createdAt: new Date().toISOString(), details: {} },
        { id: 'a2', action: 'VIEW_PRODUCT', createdAt: new Date().toISOString(), details: { productId: 'prod-001' } },
      ],
    );
  }

  async getActivityStats() {
    return this.withDemoFallback(
      () => this.request<any>('/activity/stats'),
      () => ({
        totalLogins: 42,
        totalViews: 156,
        totalCommitments: 7,
        activeUsers: 3,
      }),
    );
  }
}

export const api = new ApiClient();
