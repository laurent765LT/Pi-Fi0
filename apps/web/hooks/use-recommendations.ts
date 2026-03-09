import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function useUserId(): string | null {
  const user = useAuthStore((s) => s.user);
  return (user as any)?.id ?? null;
}

export function useRecommendations() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['recommendations', userId],
    queryFn: () => (userId ? api.getRecommendations(userId) : []),
    enabled: !!userId,
    staleTime: 300_000, // 5 min
  });
}

export function useGenerateRecommendations() {
  const qc = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('Not authenticated');
      return api.generateRecommendations(userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
}

export function useDismissRecommendation() {
  const qc = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: (productId: string) => {
      if (!userId) throw new Error('Not authenticated');
      return api.dismissRecommendation(userId, productId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
}
