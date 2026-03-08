const API_BASE = '/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
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

  // Auth
  async login(email: string, password: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
      user: any;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async refresh(refreshToken: string) {
    return this.request<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken }) },
    );
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // Products
  async getProducts(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<{ data: any[]; meta: any }>(`/products${qs}`);
  }

  async getProduct(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async getProductPayoff(id: string) {
    return this.request<any>(`/products/${id}/payoff`);
  }

  // Shelves
  async getShelves() {
    return this.request<any[]>('/shelves');
  }

  async getShelf(id: string) {
    return this.request<any>(`/shelves/${id}`);
  }

  // Commitments
  async createCommitment(shelfId: string, amount: number) {
    return this.request<any>('/commitments', {
      method: 'POST',
      body: JSON.stringify({ shelfId, amount }),
    });
  }

  async getMyCommitments() {
    return this.request<any[]>('/commitments');
  }

  async cancelCommitment(id: string) {
    return this.request<any>(`/commitments/${id}`, { method: 'DELETE' });
  }

  // Market - Quotes & History
  async getQuote(symbol: string) {
    return this.request<any>(`/market/quote/${encodeURIComponent(symbol)}`);
  }

  async getEuribor() {
    return this.request<any>('/market/euribor');
  }

  async getHistory(symbol: string) {
    return this.request<any[]>(`/market/history/${encodeURIComponent(symbol)}`);
  }

  // Market - Alpha Vantage
  async getCompanyOverview(symbol: string) {
    return this.request<any>(`/market/overview/${encodeURIComponent(symbol)}`);
  }

  async searchSymbol(query: string) {
    return this.request<any[]>(`/market/search?q=${encodeURIComponent(query)}`);
  }

  async getIntraday(symbol: string, interval: string = '5min') {
    return this.request<any[]>(`/market/intraday/${encodeURIComponent(symbol)}?interval=${interval}`);
  }

  async getForexRate(from: string, to: string) {
    return this.request<any>(`/market/forex/${from}/${to}`);
  }

  // AI (Perplexity)
  async getAiStatus() {
    return this.request<{ perplexity: boolean; features: Record<string, boolean> }>('/ai/status');
  }

  async aiChat(message: string, context?: { productNames?: string[]; productTypes?: string[] }) {
    return this.request<{ content: string; citations: string[]; model: string; tokensUsed: number }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  async analyzeUnderlying(ticker: string, name?: string) {
    const params = name ? `?name=${encodeURIComponent(name)}` : '';
    return this.request<{ content: string; citations: string[]; model: string; tokensUsed: number }>(
      `/ai/analyze/${encodeURIComponent(ticker)}${params}`,
    );
  }

  async getMarketSentiment(topic?: string) {
    const params = topic ? `?topic=${encodeURIComponent(topic)}` : '';
    return this.request<{ content: string; citations: string[]; model: string; tokensUsed: number }>(
      `/ai/sentiment${params}`,
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
    return this.request<{ content: string; citations: string[]; model: string; tokensUsed: number }>(
      '/ai/risk-assessment',
      { method: 'POST', body: JSON.stringify(product) },
    );
  }

  // Onboarding
  async uploadOrias(oriasNumber: string) {
    return this.request<any>('/onboarding/upload-orias', {
      method: 'POST',
      body: JSON.stringify({ oriasNumber }),
    });
  }

  async uploadRcp(rcpInsurer: string, rcpAmount: number) {
    return this.request<any>('/onboarding/upload-rcp', {
      method: 'POST',
      body: JSON.stringify({ rcpInsurer, rcpAmount }),
    });
  }

  async completeOnboarding() {
    return this.request<any>('/onboarding/complete', { method: 'POST' });
  }

  // Admin
  async getAdminStats() {
    return this.request<any>('/admin/stats');
  }

  // Chat
  async chat(message: string) {
    return this.request<{ reply: string; products: any[] }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // ── Pricing Engine ─────────────────────────────────────────────────────────

  async priceProduct(config: any, saveRun: boolean = true) {
    return this.request<{
      result: any;
      validation: any[];
      runId?: string;
    }>('/pricing/price', {
      method: 'POST',
      body: JSON.stringify({ config, saveRun }),
    });
  }

  async validatePricingConfig(config: any) {
    return this.request<{ valid: boolean; errors: any[] }>('/pricing/validate', {
      method: 'POST',
      body: JSON.stringify({ config }),
    });
  }

  async runScenarios(config: any, shocks?: number[]) {
    return this.request<{
      scenarios: Array<{ shock: number; result: any }>;
    }>('/pricing/scenarios', {
      method: 'POST',
      body: JSON.stringify({ config, shocks }),
    });
  }

  async getPricingHistory(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    const qs = params.toString();
    return this.request<{ runs: any[]; total: number }>(`/pricing/history${qs ? '?' + qs : ''}`);
  }

  async getPricingRun(id: string) {
    return this.request<any>(`/pricing/runs/${id}`);
  }

  async getProductTemplates() {
    return this.request<any[]>('/pricing/templates');
  }

  async getProductTemplate(id: string) {
    return this.request<any>(`/pricing/templates/${id}`);
  }

  async createProductTemplate(data: { name: string; description?: string; structureType: string; config: any }) {
    return this.request<any>('/pricing/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ── RFQ Simulator ──────────────────────────────────────────────────────────

  async createRfq(data: any) {
    return this.request<any>('/rfq', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendRfq(rfqId: string) {
    return this.request<{ rfq: any; quotes: any[] }>(`/rfq/${rfqId}/send`, {
      method: 'POST',
    });
  }

  async getRfq(rfqId: string) {
    return this.request<any>(`/rfq/${rfqId}`);
  }

  async listRfqs(opts?: { limit?: number; offset?: number; status?: string }) {
    const params = new URLSearchParams();
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.offset) params.set('offset', String(opts.offset));
    if (opts?.status) params.set('status', opts.status);
    const qs = params.toString();
    return this.request<{ rfqs: any[]; total: number }>(`/rfq${qs ? '?' + qs : ''}`);
  }

  async selectRfqQuote(rfqId: string, quoteId: string) {
    return this.request<any>(`/rfq/${rfqId}/select/${quoteId}`, {
      method: 'POST',
    });
  }

  async getRfqIssuers() {
    return this.request<any[]>('/rfq/issuers/all');
  }
}

export const api = new ApiClient();
