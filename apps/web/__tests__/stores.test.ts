import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../stores/theme-store';
import { useCompareStore } from '../stores/compare-store';
import { useLocaleStore } from '../stores/locale-store';

// ─── useThemeStore ──────────────────────────────────────────────────────────

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' });
  });

  it('has "light" as the default theme', () => {
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('sets theme to "dark"', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('sets theme to "system"', () => {
    useThemeStore.getState().setTheme('system');
    expect(useThemeStore.getState().theme).toBe('system');
  });

  it('can toggle back to "light" after changing', () => {
    useThemeStore.getState().setTheme('dark');
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
  });
});

// ─── useCompareStore ────────────────────────────────────────────────────────

describe('useCompareStore', () => {
  beforeEach(() => {
    useCompareStore.setState({ productIds: [] });
  });

  it('starts with an empty productIds array', () => {
    expect(useCompareStore.getState().productIds).toEqual([]);
  });

  it('adds a product to compare', () => {
    useCompareStore.getState().addProduct('prod-001');
    expect(useCompareStore.getState().productIds).toEqual(['prod-001']);
  });

  it('adds multiple products up to 3', () => {
    const store = useCompareStore.getState();
    store.addProduct('prod-001');
    useCompareStore.getState().addProduct('prod-002');
    useCompareStore.getState().addProduct('prod-003');
    expect(useCompareStore.getState().productIds).toEqual([
      'prod-001',
      'prod-002',
      'prod-003',
    ]);
  });

  it('does not add a 4th product (max 3 limit)', () => {
    useCompareStore.getState().addProduct('prod-001');
    useCompareStore.getState().addProduct('prod-002');
    useCompareStore.getState().addProduct('prod-003');
    useCompareStore.getState().addProduct('prod-004');
    expect(useCompareStore.getState().productIds).toHaveLength(3);
    expect(useCompareStore.getState().productIds).not.toContain('prod-004');
  });

  it('removes a product by id', () => {
    useCompareStore.getState().addProduct('prod-001');
    useCompareStore.getState().addProduct('prod-002');
    useCompareStore.getState().removeProduct('prod-001');
    expect(useCompareStore.getState().productIds).toEqual(['prod-002']);
  });

  it('removeProduct is a no-op for unknown ids', () => {
    useCompareStore.getState().addProduct('prod-001');
    useCompareStore.getState().removeProduct('prod-999');
    expect(useCompareStore.getState().productIds).toEqual(['prod-001']);
  });

  it('clearAll empties the list', () => {
    useCompareStore.getState().addProduct('prod-001');
    useCompareStore.getState().addProduct('prod-002');
    useCompareStore.getState().clearAll();
    expect(useCompareStore.getState().productIds).toEqual([]);
  });

  it('isInCompare returns true for added products', () => {
    useCompareStore.getState().addProduct('prod-001');
    expect(useCompareStore.getState().isInCompare('prod-001')).toBe(true);
  });

  it('isInCompare returns false for products not added', () => {
    expect(useCompareStore.getState().isInCompare('prod-999')).toBe(false);
  });

  it('allows adding again after clearing', () => {
    useCompareStore.getState().addProduct('prod-001');
    useCompareStore.getState().addProduct('prod-002');
    useCompareStore.getState().addProduct('prod-003');
    useCompareStore.getState().clearAll();
    useCompareStore.getState().addProduct('prod-004');
    expect(useCompareStore.getState().productIds).toEqual(['prod-004']);
  });
});

// ─── useLocaleStore ─────────────────────────────────────────────────────────

describe('useLocaleStore', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'fr' });
  });

  it('has "fr" as the default locale', () => {
    expect(useLocaleStore.getState().locale).toBe('fr');
  });

  it('sets locale to "en"', () => {
    useLocaleStore.getState().setLocale('en');
    expect(useLocaleStore.getState().locale).toBe('en');
  });

  it('can switch back to "fr"', () => {
    useLocaleStore.getState().setLocale('en');
    useLocaleStore.getState().setLocale('fr');
    expect(useLocaleStore.getState().locale).toBe('fr');
  });
});
