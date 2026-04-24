/**
 * Pure utilities usable on server + browser + CLI.
 *
 * No framework imports here (no React, no NestJS, no Prisma). Anything that
 * needs DOM / Node-specific APIs must live in the relevant app.
 */

export * from './formatters';
export * from './validators';
export * from './type-guards';
