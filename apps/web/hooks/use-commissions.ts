import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCommissionSummary(orgId?: string) {
  return useQuery({
    queryKey: ['commission-summary', orgId],
    queryFn: () => api.getCommissionSummary(orgId),
    staleTime: 60_000,
  });
}

export function useCommissionRules(orgId?: string) {
  return useQuery({
    queryKey: ['commission-rules', orgId],
    queryFn: () => api.getCommissionRules(orgId),
    staleTime: 300_000,
  });
}
