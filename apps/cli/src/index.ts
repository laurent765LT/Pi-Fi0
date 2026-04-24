#!/usr/bin/env node
// ─── Strick'in Agent-First CLI ───────────────────────────────────────────────
// Interface pilotée par agents IA pour la gestion de produits structurés.
// Compatible Claude, GPT, agents autonomes — output JSON structuré.
//
// Usage:
//   strickin products list --type AUTOCALL_PHOENIX --format json
//   strickin pricing run --product prod-001 --nominal 1000000
//   strickin rfq send --product prod-003 --issuers "BNP Paribas,Natixis"
//   strickin skills run anomaly-detection
//   strickin compliance check --product prod-001 --amount 2000000

import { Command } from 'commander';
import { setOutputFormat } from './output.js';
import type { OutputFormat } from './output.js';
import {
  productsList,
  productsGet,
  productsSearch,
  pricingRun,
  rfqSend,
  commitmentsList,
  commitmentsCreate,
  complianceCheck,
  commissionsList,
  auditReport,
} from './commands.js';
import { skillsList, skillsRun } from './skills.js';
import { aiQuery } from './ai-engine.js';
import { watchStart } from './watch.js';
import { riskAnalyze, stressTest, backtest } from './risk.js';
import { startServer } from './server.js';
import { batchProcess } from './batch.js';

const program = new Command();

program
  .name('strickin')
  .description('Strick\'in Agent-First CLI — Plateforme de produits structurés pilotée par IA')
  .version('1.0.0')
  .option('-f, --format <format>', 'Output format: json (default), table, minimal', 'json')
  .hook('preAction', (thisCommand) => {
    const format = thisCommand.opts().format as OutputFormat;
    setOutputFormat(format);
  });

// ─── Products ────────────────────────────────────────────────────────────────

const products = program.command('products').description('Gestion du catalogue de produits structurés');

products
  .command('list')
  .description('Lister les produits avec filtres')
  .option('-t, --type <type>', 'Type de payoff (AUTOCALL_PHOENIX, CAPITAL_PROTECTED, etc.)')
  .option('-i, --issuer <issuer>', 'Filtrer par émetteur')
  .option('-s, --sri <range>', 'Filtrer par SRI (ex: 2-5)')
  .option('--status <status>', 'Filtrer par statut (ACTIVE, CLOSED)')
  .option('-l, --limit <n>', 'Limiter le nombre de résultats')
  .option('--sort <field>', 'Trier par champ (préfixer - pour desc: -sri)')
  .action((opts) => productsList(opts));

products
  .command('get <id>')
  .description('Détail complet d\'un produit (par ID ou ISIN)')
  .action((id) => productsGet(id));

products
  .command('search <query>')
  .description('Recherche full-text dans le catalogue')
  .action((query) => productsSearch(query));

// ─── Pricing ─────────────────────────────────────────────────────────────────

const pricing = program.command('pricing').description('Moteur de pricing Monte Carlo');

pricing
  .command('run')
  .description('Lancer une simulation de pricing')
  .option('-p, --product <id>', 'Produit à pricer (ID ou ISIN)')
  .option('-n, --nominal <amount>', 'Nominal en EUR (défaut: 1,000,000)')
  .option('-b, --barrier <pct>', 'Barrière en %')
  .option('-c, --coupon <pct>', 'Coupon en %')
  .option('-m, --maturity <years>', 'Maturité en années')
  .action(async (opts) => await pricingRun(opts));

// ─── RFQ ─────────────────────────────────────────────────────────────────────

const rfq = program.command('rfq').description('Request for Quote — Consultation émetteurs');

rfq
  .command('send')
  .description('Envoyer une RFQ aux émetteurs et recevoir les cotations')
  .option('-p, --product <id>', 'Produit (ID ou ISIN)')
  .option('-m, --mode <mode>', 'Mode: max_coupon, target_coupon, max_protection, issuer_competition')
  .option('-i, --issuers <list>', 'Émetteurs ciblés (séparés par virgule)')
  .option('-n, --nominal <amount>', 'Nominal en EUR')
  .action(async (opts) => await rfqSend(opts));

// ─── Commitments ─────────────────────────────────────────────────────────────

const commitments = program.command('commitments').description('Gestion des marques d\'intérêt');

commitments
  .command('list')
  .description('Lister les engagements')
  .option('-s, --status <status>', 'Filtrer par statut (PENDING, CONFIRMED, WAITING)')
  .option('-p, --product <name>', 'Filtrer par nom de produit')
  .action((opts) => commitmentsList(opts));

commitments
  .command('create')
  .description('Créer une nouvelle marque d\'intérêt')
  .requiredOption('-p, --product <id>', 'Produit (ID ou ISIN)')
  .requiredOption('-a, --amount <eur>', 'Montant en EUR (min 1000)')
  .option('-c, --contract <type>', 'Type: ASSURANCE_VIE, CTO, PEA')
  .option('-i, --insurer <name>', 'Assureur enveloppe')
  .option('--clients <n>', 'Nombre de clients')
  .action((opts) => commitmentsCreate(opts));

// ─── Compliance ──────────────────────────────────────────────────────────────

const compliance = program.command('compliance').description('Vérification réglementaire MIF2/DDA');

compliance
  .command('check')
  .description('Lancer un contrôle de conformité')
  .option('-p, --product <id>', 'Produit à vérifier')
  .option('-c, --client <id>', 'Client investisseur')
  .option('-a, --amount <eur>', 'Montant de l\'investissement')
  .action((opts) => complianceCheck(opts));

// ─── Commissions ─────────────────────────────────────────────────────────────

const commissions = program.command('commissions').description('Suivi et rapprochement des commissions');

commissions
  .command('list')
  .description('Lister les commissions')
  .option('-s, --status <status>', 'Filtrer par statut (ACCRUED, PAYABLE, PAID)')
  .option('-p, --period <period>', 'Filtrer par période (ex: 2026-Q1)')
  .action((opts) => commissionsList(opts));

// ─── Audit ───────────────────────────────────────────────────────────────────

program
  .command('audit')
  .description('Générer un rapport d\'audit complet du portefeuille')
  .action(() => auditReport());

// ─── Skills ──────────────────────────────────────────────────────────────────

const skills = program.command('skills').description('Capacités IA réutilisables par les agents');

skills
  .command('list')
  .description('Lister les skills disponibles')
  .action(() => skillsList());

skills
  .command('run <name>')
  .description('Exécuter un skill')
  .option('--param <kv...>', 'Paramètres (key=value)')
  .action(async (name, opts) => {
    const params: Record<string, string> = {};
    if (opts.param) {
      for (const kv of opts.param) {
        const [key, ...rest] = kv.split('=');
        params[key] = rest.join('=');
      }
    }
    await skillsRun(name, params);
  });

// ─── Workflow (compound commands) ────────────────────────────────────────────

const workflow = program.command('workflow').description('Workflows automatisés multi-étapes');

workflow
  .command('full-check <productId>')
  .description('Workflow complet: screening → compliance → pricing → recommandation')
  .option('--profile <profile>', 'Profil de risque: conservative, moderate, aggressive', 'moderate')
  .option('--budget <amount>', 'Budget en EUR', '500000')
  .action(async (productId, opts) => {
    console.log(JSON.stringify({ workflow: 'full-check', status: 'starting', steps: 4 }));

    // Step 1: Product screening
    console.log(JSON.stringify({ step: 1, name: 'product-screening', status: 'running' }));
    await skillsRun('product-screening', { productId, riskProfile: opts.profile });

    // Step 2: Compliance check
    console.log(JSON.stringify({ step: 2, name: 'compliance-check', status: 'running' }));
    complianceCheck({ product: productId, amount: opts.budget });

    // Step 3: Pricing
    console.log(JSON.stringify({ step: 3, name: 'pricing', status: 'running' }));
    await pricingRun({ product: productId, nominal: opts.budget });

    // Step 4: Anomaly detection
    console.log(JSON.stringify({ step: 4, name: 'anomaly-detection', status: 'running' }));
    await skillsRun('anomaly-detection', {});

    console.log(JSON.stringify({ workflow: 'full-check', status: 'completed' }));
  });

workflow
  .command('batch-approve')
  .description('Workflow: évaluer et approuver automatiquement tous les engagements en attente')
  .action(async () => {
    const { COMMITMENTS } = await import('./data.js');
    const pending = COMMITMENTS.filter(c => c.status === 'PENDING');
    console.log(JSON.stringify({ workflow: 'batch-approve', pendingCount: pending.length, status: 'starting' }));

    for (const c of pending) {
      await skillsRun('auto-approval', { commitmentId: c.id });
    }

    console.log(JSON.stringify({ workflow: 'batch-approve', status: 'completed', processed: pending.length }));
  });

// ─── AI (Natural Language Interface) ─────────────────────────────────────────

program
  .command('ai <query>')
  .description('Interface langage naturel — posez votre question et l\'IA traduit en commande')
  .option('--no-execute', 'Analyser sans exécuter')
  .action(async (query, opts) => await aiQuery(query, { execute: opts.execute !== false }));

// ─── Watch (Real-Time Monitoring) ────────────────────────────────────────────

program
  .command('watch')
  .description('Monitoring temps réel avec alertes live')
  .option('-i, --interval <seconds>', 'Intervalle de scan en secondes (défaut: 5)', '5')
  .option('--closing', 'Focus sur les clôtures imminentes')
  .option('--fill', 'Focus sur le remplissage des étagères')
  .action(async (opts) => await watchStart(opts));

// ─── Risk Analytics ──────────────────────────────────────────────────────────

const risk = program.command('risk').description('Analyse de risque avancée (VaR, stress, corrélation)');

risk
  .command('analyze')
  .description('VaR, volatilité, Greeks, drawdown, concentration')
  .option('-p, --product <id>', 'Analyser un produit spécifique (sinon: portefeuille entier)')
  .option('-c, --confidence <pct>', 'Niveau de confiance VaR (défaut: 95)', '95')
  .option('-h, --horizon <days>', 'Horizon en jours (défaut: 10)', '10')
  .option('-m, --method <method>', 'Méthode: historical, parametric, monte_carlo', 'historical')
  .action(async (opts) => await riskAnalyze(opts));

risk
  .command('stress')
  .description('Stress testing multi-scénarios')
  .option('-p, --product <id>', 'Produit spécifique')
  .option('-s, --scenario <name>', 'Scénario spécifique')
  .action(async (opts) => await stressTest(opts));

risk
  .command('backtest')
  .description('Backtest historique simulé')
  .option('-p, --product <id>', 'Produit à backtester')
  .option('-y, --years <n>', 'Nombre d\'années (défaut: 5)', '5')
  .action(async (opts) => await backtest(opts));

// ─── Serve (HTTP API for Agents) ─────────────────────────────────────────────

program
  .command('serve')
  .description('Lancer en mode serveur HTTP REST pour agents externes')
  .option('-p, --port <port>', 'Port (défaut: 3100)', '3100')
  .action((opts) => startServer(opts));

// ─── Batch Processing ───────���────────────────────────────────────────────────

program
  .command('batch')
  .description('Traitement par lot depuis un fichier JSON')
  .option('-f, --file <path>', 'Fichier JSON contenant les opérations')
  .option('--stdin', 'Lire depuis stdin')
  .action(async (opts) => await batchProcess(opts));

// ─── Parse ───────────────────��─────────────────────────────────��─────────────

program.parse();
