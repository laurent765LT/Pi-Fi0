// ─── Output Utilities ────────────────────────────────────────────────────────
// Structured JSON output for agent consumption + human-readable table format.

import chalk from 'chalk';

export type OutputFormat = 'json' | 'table' | 'minimal';

let globalFormat: OutputFormat = 'json';

export function setOutputFormat(format: OutputFormat) {
  globalFormat = format;
}

export function getOutputFormat(): OutputFormat {
  return globalFormat;
}

export function output(data: unknown) {
  if (globalFormat === 'json') {
    console.log(JSON.stringify(data, null, 2));
  } else if (globalFormat === 'minimal') {
    console.log(JSON.stringify(data));
  } else {
    printTable(data);
  }
}

export function outputSuccess(message: string, data?: unknown) {
  const result = { success: true, message, ...(data ? { data } : {}) };
  if (globalFormat === 'json' || globalFormat === 'minimal') {
    console.log(JSON.stringify(result, globalFormat === 'json' ? null : undefined, globalFormat === 'json' ? 2 : undefined));
  } else {
    console.log(chalk.green('✓') + ' ' + message);
    if (data) printTable(data);
  }
}

export function outputError(message: string, details?: unknown) {
  const result = { success: false, error: message, ...(details ? { details } : {}) };
  if (globalFormat === 'json' || globalFormat === 'minimal') {
    console.error(JSON.stringify(result, globalFormat === 'json' ? null : undefined, globalFormat === 'json' ? 2 : undefined));
  } else {
    console.error(chalk.red('✗') + ' ' + message);
    if (details) console.error(details);
  }
}

function printTable(data: unknown) {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      console.log(chalk.dim('(empty)'));
      return;
    }
    const keys = Object.keys(data[0]);
    const widths = keys.map(k => Math.max(k.length, ...data.map(row => String(row[k] ?? '').length)));

    // Header
    const header = keys.map((k, i) => chalk.bold(k.padEnd(widths[i]))).join('  ');
    console.log(header);
    console.log(chalk.dim('─'.repeat(header.length)));

    // Rows
    for (const row of data) {
      const line = keys.map((k, i) => {
        const val = String(row[k] ?? '');
        return val.padEnd(widths[i]);
      }).join('  ');
      console.log(line);
    }
    console.log(chalk.dim(`\n${data.length} résultat(s)`));
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const maxKey = Math.max(...Object.keys(obj).map(k => k.length));
    for (const [key, val] of Object.entries(obj)) {
      console.log(`${chalk.bold(key.padEnd(maxKey))}  ${val}`);
    }
  } else {
    console.log(data);
  }
}

export function spinner(message: string): { stop: (finalMessage?: string) => void } {
  if (globalFormat !== 'table') {
    return { stop: () => {} };
  }
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const interval = setInterval(() => {
    process.stderr.write(`\r${chalk.cyan(frames[i++ % frames.length])} ${message}`);
  }, 80);
  return {
    stop(finalMessage?: string) {
      clearInterval(interval);
      process.stderr.write(`\r${chalk.green('✓')} ${finalMessage ?? message}\n`);
    },
  };
}
