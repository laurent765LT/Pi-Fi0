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
}

export const api = new ApiClient();
