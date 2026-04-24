import { describe, expect, it } from 'vitest';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService.computeHash', () => {
  const service = new AuditLogService({
    // The test doesn't touch Prisma — we just need a shell.
    auditLog: undefined,
  } as unknown as never);

  it('is deterministic for the same input', () => {
    const ts = new Date('2026-01-01T00:00:00Z');
    const a = service.computeHash('0', { action: 'LOGIN' }, ts);
    const b = service.computeHash('0', { action: 'LOGIN' }, ts);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
  });

  it('changes when any input changes (hash chain)', () => {
    const ts = new Date('2026-01-01T00:00:00Z');
    const base = service.computeHash('0', { action: 'LOGIN' }, ts);
    expect(service.computeHash('1', { action: 'LOGIN' }, ts)).not.toBe(base);
    expect(service.computeHash('0', { action: 'LOGOUT' }, ts)).not.toBe(base);
    expect(
      service.computeHash('0', { action: 'LOGIN' }, new Date(ts.getTime() + 1)),
    ).not.toBe(base);
  });
});
