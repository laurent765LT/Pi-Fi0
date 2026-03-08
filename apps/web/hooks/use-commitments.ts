'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useMyCommitments() {
  return useQuery({
    queryKey: ['commitments'],
    queryFn: () => api.getMyCommitments(),
  });
}

export function useCreateCommitment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shelfId, amount }: { shelfId: string; amount: number }) =>
      api.createCommitment(shelfId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitments'] });
    },
  });
}

export function useCancelCommitment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.cancelCommitment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitments'] });
    },
  });
}
