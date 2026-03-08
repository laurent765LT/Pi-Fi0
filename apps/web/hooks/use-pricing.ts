'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Price a Product (mutation) ──────────────────────────────────────────────

export function usePriceProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { config: any; saveRun?: boolean }) =>
      api.priceProduct(params.config, params.saveRun),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing', 'history'] });
    },
  });
}

// ── Validate Config (mutation) ──────────────────────────────────────────────

export function useValidatePricingConfig() {
  return useMutation({
    mutationFn: (config: any) => api.validatePricingConfig(config),
  });
}

// ── Run Scenarios (mutation) ────────────────────────────────────────────────

export function useRunScenarios() {
  return useMutation({
    mutationFn: (params: { config: any; shocks?: number[] }) =>
      api.runScenarios(params.config, params.shocks),
  });
}

// ── Pricing History ─────────────────────────────────────────────────────────

export function usePricingHistory(limit?: number, offset?: number) {
  return useQuery({
    queryKey: ['pricing', 'history', limit, offset],
    queryFn: () => api.getPricingHistory(limit, offset),
    staleTime: 30_000,
  });
}

// ── Pricing Run Detail ──────────────────────────────────────────────────────

export function usePricingRun(id: string) {
  return useQuery({
    queryKey: ['pricing', 'run', id],
    queryFn: () => api.getPricingRun(id),
    enabled: Boolean(id),
  });
}

// ── Product Templates ───────────────────────────────────────────────────────

export function useProductTemplates() {
  return useQuery({
    queryKey: ['pricing', 'templates'],
    queryFn: () => api.getProductTemplates(),
    staleTime: 300_000, // 5 min
  });
}

export function useProductTemplate(id: string) {
  return useQuery({
    queryKey: ['pricing', 'template', id],
    queryFn: () => api.getProductTemplate(id),
    enabled: Boolean(id),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; structureType: string; config: any }) =>
      api.createProductTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing', 'templates'] });
    },
  });
}
