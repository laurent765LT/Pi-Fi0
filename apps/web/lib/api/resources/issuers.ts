// ─── Issuers resource ────────────────────────────────────────────────────────

import { apiClient } from '../client';
import type { Issuer } from '../types';

export const issuersApi = {
  list: () => apiClient.get<Issuer[]>('/issuers'),
  get: (id: string) => apiClient.get<Issuer>(`/issuers/${id}`),
};
