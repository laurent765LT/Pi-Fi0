// ─── Strick'in CLI — HTTP Server Mode ────────────────────────────────────────
// Exposes all CLI commands as REST API endpoints for external agent integration.
// Run: strickin serve --port 3100

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { PRODUCTS, COMMITMENTS, COMMISSIONS, ISSUERS } from './data.js';
import { SKILLS } from './skills.js';

interface Route {
  method: string;
  path: RegExp;
  handler: (req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: any) => Promise<void>;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const routes: Route[] = [
  // Health
  {
    method: 'GET', path: /^\/health$/,
    handler: async (_req, res) => json(res, { status: 'ok', version: '1.0.0', agent: 'strickin-cli', timestamp: new Date().toISOString() }),
  },

  // OpenAPI schema (for agent discovery)
  {
    method: 'GET', path: /^\/schema$/,
    handler: async (_req, res) => json(res, generateSchema()),
  },

  // Products
  {
    method: 'GET', path: /^\/products$/,
    handler: async (req, res) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      let results = [...PRODUCTS];
      const type = url.searchParams.get('type');
      const issuer = url.searchParams.get('issuer');
      const sri = url.searchParams.get('sri');
      const limit = url.searchParams.get('limit');
      if (type) results = results.filter(p => p.payoffType === type);
      if (issuer) results = results.filter(p => p.issuerName.toLowerCase().includes(issuer.toLowerCase()));
      if (sri) {
        const [min, max] = sri.includes('-') ? sri.split('-').map(Number) : [Number(sri), Number(sri)];
        results = results.filter(p => p.sri >= min && p.sri <= max);
      }
      if (limit) results = results.slice(0, Number(limit));
      json(res, { count: results.length, products: results });
    },
  },
  {
    method: 'GET', path: /^\/products\/(.+)$/,
    handler: async (_req, res, params) => {
      const p = PRODUCTS.find(p => p.id === params.id || p.isin === params.id);
      if (!p) return json(res, { error: 'Not found' }, 404);
      json(res, p);
    },
  },

  // Search
  {
    method: 'GET', path: /^\/search$/,
    handler: async (req, res) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const results = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(q) || p.isin.toLowerCase().includes(q) ||
        p.issuerName.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
      json(res, { query: q, count: results.length, products: results });
    },
  },

  // Commitments
  {
    method: 'GET', path: /^\/commitments$/,
    handler: async (req, res) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      let results = [...COMMITMENTS];
      const status = url.searchParams.get('status');
      if (status) results = results.filter(c => c.status === status.toUpperCase());
      json(res, { count: results.length, totalAmount: results.reduce((s, c) => s + c.amount, 0), commitments: results });
    },
  },
  {
    method: 'POST', path: /^\/commitments$/,
    handler: async (_req, res, _params, body) => {
      const product = PRODUCTS.find(p => p.id === body.productId || p.isin === body.productId);
      if (!product) return json(res, { error: 'Product not found' }, 400);
      if (!body.amount || body.amount < 1000) return json(res, { error: 'Amount must be >= 1000' }, 400);
      const commitment = {
        id: `c-${Date.now().toString(36)}`,
        shelfId: product.id,
        productName: product.name,
        amount: body.amount,
        contractType: body.contractType ?? 'ASSURANCE_VIE',
        insurerEnvelope: body.insurer ?? 'Generali Vie',
        clientCount: body.clients ?? 1,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      json(res, { success: true, commitment }, 201);
    },
  },

  // Commissions
  {
    method: 'GET', path: /^\/commissions$/,
    handler: async (_req, res) => {
      json(res, { count: COMMISSIONS.length, totalAmount: COMMISSIONS.reduce((s, c) => s + c.amount, 0), commissions: COMMISSIONS });
    },
  },

  // Compliance
  {
    method: 'POST', path: /^\/compliance\/check$/,
    handler: async (_req, res, _params, body) => {
      const product = body.productId ? PRODUCTS.find(p => p.id === body.productId || p.isin === body.productId) : null;
      const checks = [
        { rule: 'KID_DELIVERY', status: 'PASS' },
        { rule: 'SRI_ADEQUACY', status: product && product.sri >= 6 ? 'WARNING' : 'PASS' },
        { rule: 'MIF2_SUITABILITY', status: 'PASS' },
        { rule: 'DDA_DISCLOSURE', status: product && product.entryFeePct > 6 ? 'WARNING' : 'PASS' },
        { rule: 'AMOUNT_THRESHOLD', status: body.amount > 5_000_000 ? 'WARNING' : 'PASS' },
        { rule: 'PRODUCT_GOVERNANCE', status: 'PASS' },
      ];
      const failCount = checks.filter(c => c.status === 'FAIL').length;
      const warnCount = checks.filter(c => c.status === 'WARNING').length;
      json(res, { overallStatus: failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARNING' : 'PASS', checks });
    },
  },

  // Pricing
  {
    method: 'POST', path: /^\/pricing$/,
    handler: async (_req, res, _params, body) => {
      const product = body.productId ? PRODUCTS.find(p => p.id === body.productId) : null;
      const barrier = body.barrier ?? product?.barrierCapPct ?? 50;
      const nominal = body.nominal ?? 1_000_000;
      const fairValue = 95 + (barrier / 100) * 4 - ((body.coupon ?? 5) / 100) * 3 + Math.random() * 1.5;
      json(res, {
        fairValuePct: round2(fairValue),
        fairValueAmount: round2(nominal * fairValue / 100),
        spreadBps: Math.round(110 + Math.random() * 40),
        probabilities: { autocallPct: round2(45 + Math.random() * 20), capitalLossPct: round2(5 + Math.random() * 10) },
      });
    },
  },

  // RFQ
  {
    method: 'POST', path: /^\/rfq$/,
    handler: async (_req, res, _params, body) => {
      const product = body.productId ? PRODUCTS.find(p => p.id === body.productId) : PRODUCTS[0];
      const issuers = body.issuers ?? ISSUERS;
      const quotes = issuers.map((issuer: string) => ({
        issuer,
        pricePct: round2(97 + Math.random() * 3),
        spreadBps: Math.round(80 + Math.random() * 60),
        feesPct: round2(0.5 + Math.random() * 1),
      })).sort((a: any, b: any) => b.pricePct - a.pricePct);
      json(res, {
        rfqId: `rfq-${Date.now().toString(36)}`,
        product: product ? { id: product.id, name: product.name } : null,
        quotes: quotes.map((q: any, i: number) => ({ ...q, rank: i + 1, bestOffer: i === 0 })),
      });
    },
  },

  // Audit
  {
    method: 'GET', path: /^\/audit$/,
    handler: async (_req, res) => {
      const totalEngaged = PRODUCTS.reduce((s, p) => s + p.totalEngaged, 0);
      json(res, {
        totalProducts: PRODUCTS.length,
        totalEngaged,
        avgFillPct: round2(PRODUCTS.reduce((s, p) => s + p.fillPct, 0) / PRODUCTS.length),
        totalCommitments: COMMITMENTS.length,
        totalCommissions: COMMISSIONS.reduce((s, c) => s + c.amount, 0),
      });
    },
  },

  // Skills
  {
    method: 'GET', path: /^\/skills$/,
    handler: async (_req, res) => {
      json(res, { skills: SKILLS.map(s => ({ name: s.name, description: s.description, category: s.category, inputSchema: s.inputSchema })) });
    },
  },
  {
    method: 'POST', path: /^\/skills\/(.+)$/,
    handler: async (_req, res, params, body) => {
      const skill = SKILLS.find(s => s.name === params.id);
      if (!skill) return json(res, { error: 'Skill not found' }, 404);
      // Capture output
      const origLog = console.log;
      let captured: unknown = null;
      console.log = (data: unknown) => { captured = typeof data === 'string' ? JSON.parse(data) : data; };
      await skill.run(body ?? {});
      console.log = origLog;
      json(res, captured ?? { executed: true });
    },
  },
];

// ─── Server ──────────────────────────────────────────────────────────────────

export function startServer(opts: { port?: string }) {
  const port = Number(opts.port ?? 3100);

  const server = createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const url = new URL(req.url!, `http://${req.headers.host}`);
    const path = url.pathname;

    // Find matching route
    for (const route of routes) {
      if (req.method !== route.method) continue;
      const match = path.match(route.path);
      if (!match) continue;

      const params: Record<string, string> = {};
      if (match[1]) params.id = match[1];

      let body: any = {};
      if (req.method === 'POST') {
        body = await parseBody(req);
      }

      try {
        await route.handler(req, res, params, body);
      } catch (err) {
        json(res, { error: 'Internal error', detail: String(err) }, 500);
      }
      return;
    }

    json(res, { error: 'Not found', path }, 404);
  });

  server.listen(port, () => {
    const info = {
      status: 'running',
      port,
      baseUrl: `http://localhost:${port}`,
      endpoints: routes.map(r => `${r.method} ${r.path.source.replace(/\\/g, '').replace(/\^|\$/g, '').replace(/\(\.\+\)/, ':id')}`),
      agentConfig: {
        description: 'Strick\'in Agent-First API — Structured products platform',
        healthCheck: `http://localhost:${port}/health`,
        schemaUrl: `http://localhost:${port}/schema`,
      },
    };
    console.log(JSON.stringify(info, null, 2));
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

function generateSchema() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Strick\'in Agent-First API',
      version: '1.0.0',
      description: 'REST API for AI agents to interact with the structured products platform',
    },
    paths: {
      '/health': { get: { summary: 'Health check', responses: { '200': { description: 'OK' } } } },
      '/products': { get: { summary: 'List products', parameters: [
        { name: 'type', in: 'query', schema: { type: 'string' } },
        { name: 'issuer', in: 'query', schema: { type: 'string' } },
        { name: 'sri', in: 'query', schema: { type: 'string' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
      ] } },
      '/products/{id}': { get: { summary: 'Get product details' } },
      '/search': { get: { summary: 'Search products', parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }] } },
      '/commitments': { get: { summary: 'List commitments' }, post: { summary: 'Create commitment' } },
      '/commissions': { get: { summary: 'List commissions' } },
      '/compliance/check': { post: { summary: 'Run compliance check' } },
      '/pricing': { post: { summary: 'Run pricing simulation' } },
      '/rfq': { post: { summary: 'Send RFQ to issuers' } },
      '/audit': { get: { summary: 'Generate audit report' } },
      '/skills': { get: { summary: 'List available skills' } },
      '/skills/{name}': { post: { summary: 'Execute a skill' } },
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
