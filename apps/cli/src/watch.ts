// ─── Strick'in CLI — Real-Time Watch / Monitoring ────────────────────────────
// Continuous monitoring mode with alerts and live data updates.

import chalk from 'chalk';
import { PRODUCTS, COMMITMENTS, COMMISSIONS } from './data.js';
import { output, getOutputFormat } from './output.js';

interface Alert {
  id: string;
  type: 'CLOSING' | 'FILL' | 'ANOMALY' | 'COMMITMENT' | 'COMMISSION' | 'MARKET';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  productId?: string;
  timestamp: string;
}

// ─── Watch Mode ──────────────────────────────────────────────────────────────

export async function watchStart(opts: {
  interval?: string;
  alerts?: string;
  closing?: boolean;
  fill?: boolean;
}) {
  const intervalMs = Number(opts.interval ?? 5) * 1000;
  const isJson = getOutputFormat() !== 'table';

  if (isJson) {
    // JSON mode: single scan + output
    const snapshot = generateSnapshot();
    output(snapshot);
    return;
  }

  // Table mode: live dashboard
  console.log(chalk.bold.cyan('\n  ╔══════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('  ║') + chalk.bold('   STRICK\'IN — Live Monitoring Dashboard          ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('  ╚══════════════════════════════════════════════════════╝\n'));

  let cycle = 0;
  const maxCycles = 6; // Run 6 cycles then stop (demo)

  const tick = () => {
    cycle++;
    const snapshot = generateSnapshot();
    const alerts = generateAlerts(cycle);

    // Header
    console.log(chalk.dim(`\n─── Scan #${cycle} · ${new Date().toLocaleTimeString('fr-FR')} ${'─'.repeat(35)}`));

    // Portfolio summary
    console.log(chalk.bold('\n  📊 Portfolio'));
    console.log(`     Produits actifs: ${chalk.green(String(snapshot.portfolio.activeProducts))}  |  Engagements: ${chalk.yellow(String(snapshot.portfolio.totalCommitments))}  |  Commissions: ${chalk.cyan(formatEur(snapshot.portfolio.totalCommissions))}`);
    console.log(`     Volume engagé: ${chalk.bold(formatEur(snapshot.portfolio.totalEngaged))}  |  Remplissage moyen: ${chalk.bold(snapshot.portfolio.avgFillPct + '%')}`);

    // Closing soon
    if (snapshot.closingSoon.length > 0) {
      console.log(chalk.bold('\n  ⏰ Clôtures imminentes'));
      for (const p of snapshot.closingSoon) {
        const urgency = p.daysToClose <= 5 ? chalk.red.bold : p.daysToClose <= 15 ? chalk.yellow : chalk.dim;
        console.log(`     ${urgency(`J-${p.daysToClose}`)}  ${p.name}  (${p.fillPct}% rempli)`);
      }
    }

    // Fill progress
    const highFill = snapshot.fillAlerts;
    if (highFill.length > 0) {
      console.log(chalk.bold('\n  📈 Remplissage'));
      for (const p of highFill) {
        const bar = progressBar(p.fillPct, 20);
        console.log(`     ${bar} ${p.fillPct}%  ${p.name}`);
      }
    }

    // Alerts
    if (alerts.length > 0) {
      console.log(chalk.bold('\n  🔔 Alertes'));
      for (const a of alerts) {
        const icon = a.severity === 'CRITICAL' ? chalk.red('●') : a.severity === 'WARNING' ? chalk.yellow('●') : chalk.blue('●');
        console.log(`     ${icon} ${a.message}`);
      }
    }

    // Market simulation
    const marketMove = (Math.random() - 0.5) * 2;
    const eurostoxx = 4850 + marketMove * 50 + cycle * 5;
    const gold = 2350 + (Math.random() - 0.5) * 20;
    const eurCms = 2.85 + (Math.random() - 0.5) * 0.1;
    console.log(chalk.bold('\n  📉 Marché (simulé)'));
    console.log(`     Euro Stoxx 50: ${colorNum(eurostoxx, 4850)}  |  Or: ${colorNum(gold, 2350)}$  |  EUR CMS 10Y: ${colorNum(eurCms, 2.85, 2)}%`);

    if (cycle >= maxCycles) {
      console.log(chalk.dim(`\n─── Monitoring arrêté après ${maxCycles} cycles (mode démo) ───\n`));
      return;
    }
  };

  // First tick immediately
  tick();

  // Subsequent ticks
  for (let i = 1; i < maxCycles; i++) {
    await delay(intervalMs);
    tick();
  }
}

// ─── Snapshot Generation ─────────────────────────────────────────────────────

function generateSnapshot() {
  const now = Date.now();

  const closingSoon = PRODUCTS
    .map(p => ({
      id: p.id, name: p.name, fillPct: p.fillPct,
      daysToClose: Math.ceil((new Date(p.shelfClosingDate).getTime() - now) / (1000 * 60 * 60 * 24)),
      shelfClosingDate: p.shelfClosingDate,
    }))
    .filter(p => p.daysToClose > 0 && p.daysToClose <= 30)
    .sort((a, b) => a.daysToClose - b.daysToClose);

  const fillAlerts = PRODUCTS
    .filter(p => p.fillPct >= 70)
    .map(p => ({ id: p.id, name: p.name, fillPct: p.fillPct, targetAmount: p.targetAmount }))
    .sort((a, b) => b.fillPct - a.fillPct);

  const pendingCommitments = COMMITMENTS.filter(c => c.status === 'PENDING');
  const totalEngaged = PRODUCTS.reduce((s, p) => s + p.totalEngaged, 0);
  const totalCommissions = COMMISSIONS.reduce((s, c) => s + c.amount, 0);

  return {
    timestamp: new Date().toISOString(),
    portfolio: {
      activeProducts: PRODUCTS.filter(p => p.status === 'ACTIVE').length,
      totalEngaged,
      avgFillPct: Math.round(PRODUCTS.reduce((s, p) => s + p.fillPct, 0) / PRODUCTS.length),
      totalCommitments: COMMITMENTS.length,
      pendingCommitments: pendingCommitments.length,
      totalCommissions,
    },
    closingSoon,
    fillAlerts,
    pendingCommitments,
    market: {
      euroStoxx50: round2(4850 + (Math.random() - 0.5) * 100),
      goldUsd: round2(2350 + (Math.random() - 0.5) * 40),
      eurCms10y: round2(2.85 + (Math.random() - 0.5) * 0.2),
    },
  };
}

// ─── Alert Generation ────────────────────────────────────────────────────────

function generateAlerts(cycle: number): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  // Simulated real-time events
  const events = [
    { cycle: 1, alert: { type: 'COMMITMENT' as const, severity: 'INFO' as const, message: 'Nouvel engagement 150k€ sur M Equilibre 7 — CGP Dupont' } },
    { cycle: 2, alert: { type: 'MARKET' as const, severity: 'WARNING' as const, message: 'Euro Stoxx 50 -1.2% — impact potentiel sur 8 autocalls' } },
    { cycle: 3, alert: { type: 'FILL' as const, severity: 'INFO' as const, message: 'Sélection Souveraineté Europe atteint 95% de remplissage' } },
    { cycle: 3, alert: { type: 'COMMISSION' as const, severity: 'INFO' as const, message: 'Commission 3,600€ passée en PAYABLE — M Equilibre 5' } },
    { cycle: 4, alert: { type: 'CLOSING' as const, severity: 'CRITICAL' as const, message: 'M Equilibre CT : clôture DEMAIN — 85% rempli, 2.25M€ restant' } },
    { cycle: 5, alert: { type: 'ANOMALY' as const, severity: 'WARNING' as const, message: 'Concentration SG Issuer 40.3% > seuil 35% — diversification recommandée' } },
    { cycle: 5, alert: { type: 'COMMITMENT' as const, severity: 'INFO' as const, message: 'Engagement c5 (1M€) approuvé automatiquement — M Equilibre CT' } },
    { cycle: 6, alert: { type: 'MARKET' as const, severity: 'INFO' as const, message: 'EUR CMS 10Y stable à 2.85% — coupons conditionnels activés' } },
  ];

  for (const e of events) {
    if (e.cycle === cycle) {
      alerts.push({ id: `alert-${cycle}-${alerts.length}`, ...e.alert, timestamp: now });
    }
  }

  return alerts;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function progressBar(pct: number, width: number): string {
  const filled = Math.round(pct / 100 * width);
  const empty = width - filled;
  const color = pct > 80 ? chalk.green : pct > 50 ? chalk.yellow : chalk.cyan;
  return color('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
}

function formatEur(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k€`;
  return `${n}€`;
}

function colorNum(val: number, base: number, decimals = 0): string {
  const diff = val - base;
  const str = val.toFixed(decimals);
  return diff >= 0 ? chalk.green(str) : chalk.red(str);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
