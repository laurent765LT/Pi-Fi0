'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useReviewCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.reviewCommitment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commitments'] }),
  });
}

export function useApproveCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.approveCommitment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commitments'] }),
  });
}

export function useRejectCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.rejectCommitment(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commitments'] }),
  });
}
