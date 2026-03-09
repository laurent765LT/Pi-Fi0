import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function useUserId(): string | null {
  const user = useAuthStore((s) => s.user);
  return (user as any)?.id ?? null;
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: (productId: string) => {
      if (!userId) throw new Error('Not authenticated');
      return api.toggleFavorite(userId, productId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useFavorites() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: () => (userId ? api.getUserFavorites(userId) : []),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useIsFavorite(productId: string) {
  const userId = useUserId();

  return useQuery({
    queryKey: ['favorites', 'check', userId, productId],
    queryFn: () => (userId ? api.checkFavorite(userId, productId) : false),
    enabled: !!userId && !!productId,
    staleTime: 60_000,
  });
}

export function useRecentViews(limit?: number) {
  const userId = useUserId();

  return useQuery({
    queryKey: ['recent-views', userId, limit],
    queryFn: () => (userId ? api.getRecentViews(userId, limit) : []),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useTrackView() {
  const userId = useUserId();

  return useMutation({
    mutationFn: (productId: string) => {
      if (!userId) throw new Error('Not authenticated');
      return api.trackProductView(userId, productId);
    },
  });
}

export function useMostViewed(limit?: number) {
  return useQuery({
    queryKey: ['most-viewed', limit],
    queryFn: () => api.getMostViewedProducts(limit),
    staleTime: 300_000,
  });
}
