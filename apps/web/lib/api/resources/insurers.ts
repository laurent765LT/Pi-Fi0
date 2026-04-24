// ─── Insurers resource ───────────────────────────────────────────────────────

import { apiClient } from '../client';
import type { Insurer } from '../types';

export const insurersApi = {
  list: () => apiClient.get<Insurer[]>('/insurers'),
  get: (id: string) => apiClient.get<Insurer>(`/insurers/${id}`),
};
