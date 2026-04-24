// ─── Strick'in CLI — Batch Processing Engine ────────────────────────────────
// Process multiple operations from a JSON file or stdin.
// Usage: strickin batch --file operations.json
//        echo '[{"op":"products.list"}]' | strickin batch --stdin

import { readFileSync } from 'node:fs';
import { PRODUCTS, COMMITMENTS } from './data.js';
import { output, spinner } from './output.js';
import { skillsRun } from './skills.js';

interface BatchOperation {
  op: string;
  params?: Record<string, any>;
  id?: string;
}

interface BatchResult {
  id: string;
  op: string;
  status: 'success' | 'error';
  duration_ms: number;
  result?: unknown;
  error?: string;
}

export async function batchProcess(opts: { file?: string; stdin?: boolean }) {
  let operations: BatchOperation[];

  if (opts.file) {
    const raw = readFileSync(opts.file, 'utf-8');
    operations = JSON.parse(raw);
  } else if (opts.stdin) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    operations = JSON.parse(Buffer.concat(chunks).toString());
  } else {
    output({ error: 'Specify --file or --stdin' });
    process.exit(1);
  }

  if (!Array.isArray(operations)) {
    output({ error: 'Input must be a JSON array of operations' });
    process.exit(1);
  }

  const s = spinner(`Processing ${operations.length} operations...`);
  const results: BatchResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const opId = op.id ?? `op-${i + 1}`;
    const opStart = Date.now();

    try {
      const result = await executeOperation(op);
      results.push({
        id: opId,
        op: op.op,
        status: 'success',
        duration_ms: Date.now() - opStart,
        result,
      });
    } catch (err) {
      results.push({
        id: opId,
        op: op.op,
        status: 'error',
        duration_ms: Date.now() - opStart,
        error: String(err),
      });
    }
  }

  s.stop(`Processed ${operations.length} operations`);

  const totalMs = Date.now() - startTime;
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  output({
    batch: {
      totalOperations: operations.length,
      succeeded: successCount,
      failed: errorCount,
      totalDurationMs: totalMs,
      avgDurationMs: Math.round(totalMs / operations.length),
    },
    results,
  });
}

async function executeOperation(op: BatchOperation): Promise<unknown> {
  const params = op.params ?? {};

  switch (op.op) {
    case 'products.list': {
      let results = [...PRODUCTS];
      if (params.type) results = results.filter(p => p.payoffType === params.type);
      if (params.issuer) results = results.filter(p => p.issuerName.toLowerCase().includes(params.issuer.toLowerCase()));
      if (params.sri) {
        const [min, max] = String(params.sri).includes('-')
          ? String(params.sri).split('-').map(Number)
          : [Number(params.sri), Number(params.sri)];
        results = results.filter(p => p.sri >= min && p.sri <= max);
      }
      if (params.limit) results = results.slice(0, Number(params.limit));
      return { count: results.length, products: results.map(p => ({ id: p.id, isin: p.isin, name: p.name, sri: p.sri })) };
    }

    case 'products.get': {
      const p = PRODUCTS.find(p => p.id === params.id || p.isin === params.id);
      if (!p) throw new Error(`Product not found: ${params.id}`);
      return p;
    }

    case 'products.search': {
      const q = (params.query ?? '').toLowerCase();
      const results = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(q) || p.isin.toLowerCase().includes(q)
      );
      return { count: results.length, products: results.map(p => ({ id: p.id, name: p.name })) };
    }

    case 'commitments.list': {
      let results = [...COMMITMENTS];
      if (params.status) results = results.filter(c => c.status === params.status);
      return { count: results.length, commitments: results };
    }

    case 'commitments.create': {
      const product = PRODUCTS.find(p => p.id === params.productId || p.isin === params.productId);
      if (!product) throw new Error(`Product not found: ${params.productId}`);
      if (!params.amount || params.amount < 1000) throw new Error('Amount must be >= 1000');
      return {
        id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        shelfId: product.id,
        productName: product.name,
        amount: params.amount,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
    }

    case 'compliance.check': {
      const product = params.productId ? PRODUCTS.find(p => p.id === params.productId) : null;
      return {
        overallStatus: product && product.sri >= 6 ? 'WARNING' : 'PASS',
        sriCheck: product ? `SRI ${product.sri}/7` : 'N/A',
        amountCheck: params.amount > 5_000_000 ? 'WARNING' : 'PASS',
      };
    }

    case 'pricing.run': {
      const barrier = params.barrier ?? 50;
      const nominal = params.nominal ?? 1_000_000;
      const fairValue = 95 + (barrier / 100) * 4 + Math.random() * 1.5;
      await delay(100); // Simulate compute
      return {
        fairValuePct: round2(fairValue),
        fairValueAmount: round2(nominal * fairValue / 100),
        spreadBps: Math.round(110 + Math.random() * 40),
      };
    }

    case 'skills.run': {
      if (!params.skill) throw new Error('Missing skill name');
      // Capture output
      const origLog = console.log;
      let captured: unknown = null;
      console.log = (data: unknown) => {
        try { captured = typeof data === 'string' ? JSON.parse(data) : data; } catch { captured = data; }
      };
      await skillsRun(params.skill, params.skillParams ?? {});
      console.log = origLog;
      return captured;
    }

    default:
      throw new Error(`Unknown operation: ${op.op}`);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
